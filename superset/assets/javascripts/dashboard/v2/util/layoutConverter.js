const GRID_RATIO = 4;
const ROW_HEIGHT = 16;
const generateId = function() {
  let componentId = 1;
  return () => (componentId++);
}();

/**
 *
 * @param positions: single array of slices
 * @returns boundary object {top: number, bottom: number, left: number, right: number}
 */
function getBoundary(positions) {
  let top = Number.MAX_VALUE, bottom = 0,
    left = Number.MAX_VALUE, right = 1;
  positions.forEach(item => {
    const { row, col, size_x, size_y } = item;
    if (row <= top) top = row;
    if (col <= left ) left = col;
    if (bottom <= row + size_y) bottom = row + size_y;
    if (right <= col + size_x) right = col + size_x;
  });

  return {
    top,
    bottom,
    left,
    right
  };
}

function getRowContainer() {
  const id = 'DASHBOARD_ROW_TYPE-' + generateId();
  return {
    version: 'v2',
    type: 'DASHBOARD_ROW_TYPE',
    id,
    children: [],
    meta: {
      background: 'BACKGROUND_TRANSPARENT',
    },
  };
}

function getColContainer() {
  const id = 'DASHBOARD_COLUMN_TYPE-' + generateId();
  return {
    version: 'v2',
    type: 'DASHBOARD_COLUMN_TYPE',
    id,
    children: [],
    meta: {
      background: 'BACKGROUND_TRANSPARENT',
    },
  };
}

function getChartHolder(item) {
  const { row, col, size_x, size_y, slice_id } = item;
  const converted = {
    row: Math.round(row / GRID_RATIO),
    col: Math.floor((col - 1) / GRID_RATIO) + 1,
    size_x: Math.max(1, Math.floor(size_x / GRID_RATIO)),
    size_y: Math.max(1, Math.round(size_y / GRID_RATIO)),
    slice_id,
  };

  return {
    version: 'v2',
    type: 'DASHBOARD_CHART_TYPE',
    id: 'DASHBOARD_CHART_TYPE-' + generateId(),
    children: [],
    meta: {
      width: converted.size_x,
      height: Math.round(converted.size_y * 100 / ROW_HEIGHT ),
      chartKey: 'slice_' + slice_id,
    },
  };
}

function getChildrenMax(items, attr, layout) {
  return Math.max.apply(null, items.map(child => {
    return layout[child].meta[attr];
  }));
}

function getChildrenSum(items, attr, layout) {
  return items.reduce((preValue, child) => {
    return preValue + layout[child].meta[attr];
  }, 0);
}

function sortByRowId(item1, item2) {
  return item1.row - item2.row;
}

function sortByColId(item1, item2) {
  return item1.col - item2.col;
}

function hasOverlap(positions, xAxis = true) {
  return positions.slice()
    .sort(!!xAxis ? sortByColId : sortByRowId)
    .some((item, index, arr) => {
      if (index === arr.length - 1) {
        return false;
      }

      if (!!xAxis) {
        return (item.col + item.size_x) > arr[index + 1].col;
      } else {
        return (item.row + item.size_y) > arr[index + 1].row;
      }
    });
}

function doConvert(positions, level, parent, root) {
  if (positions.length === 0) {
    return;
  }

  if (positions.length === 1) {
    // special treatment for single chart dash, always wrap chart inside a row
    if (parent.type === 'DASHBOARD_GRID_TYPE') {
      const rowContainer = getRowContainer();
      root[rowContainer.id] = rowContainer;
      parent.children.push(rowContainer.id);
      parent = rowContainer;
    }

    const chartHolder = getChartHolder(positions[0]);
    root[chartHolder.id] = chartHolder;
    parent.children.push(chartHolder.id);
    return;
  }

  let currentItems = positions.slice();
  const { top, bottom, left, right } = getBoundary(positions);
  // find row dividers
  const layers = [];
  let currentRow = top + 1;
  while (currentItems.length && currentRow <= bottom) {
    const upper = [],
      lower = [];

    const isRowDivider = currentItems.every(item => {
      const { row, col, size_x, size_y } = item;
      if (row + size_y <= currentRow) {
        lower.push(item);
        return true;
      } else if (row >= currentRow) {
        upper.push(item);
        return true;
      } else {
        return false;
      }
    });

    if (isRowDivider) {
      currentItems = upper.slice();
      layers.push(lower);
    }
    currentRow++;
  }

  layers.forEach((layer) => {
    // create a new row
    const rowContainer = getRowContainer();
    root[rowContainer.id] = rowContainer;
    parent.children.push(rowContainer.id);

    currentItems = layer.slice();
    if (!hasOverlap(currentItems)) {
      currentItems.sort(sortByColId).forEach(item => {
        const chartHolder = getChartHolder(item);
        root[chartHolder.id] = chartHolder;
        rowContainer.children.push(chartHolder.id);
      });
    } else {
      // find col dividers for each layer
      let currentCol = left + 1;
      while (currentItems.length && currentCol <= right) {
        const upper = [],
          lower = [];

        const isColDivider = currentItems.every(item => {
          const { row, col, size_x, size_y } = item;
          if (col + size_x <= currentCol) {
            lower.push(item);
            return true;
          } else if (col >= currentCol) {
            upper.push(item);
            return true;
          } else {
            return false;
          }
        });

        if (isColDivider) {
          // create a new column
          const colContainer = getColContainer();
          root[colContainer.id] = colContainer;
          rowContainer.children.push(colContainer.id);

          if (!hasOverlap(lower, false)) {
            lower.sort(sortByRowId).forEach(item => {
              const chartHolder = getChartHolder(item);
              root[chartHolder.id] = chartHolder;
              colContainer.children.push(chartHolder.id);
            });
          } else {
            doConvert(lower, level+2, colContainer, root);
          }

          // add col meta
          colContainer.meta.width = getChildrenMax(colContainer.children, 'width', root);
          colContainer.meta.height = getChildrenSum(colContainer.children, 'height', root);

          currentItems = upper.slice();
        }
        currentCol++;
      }
    }

    rowContainer.meta.width = getChildrenSum(rowContainer.children, 'width', root);
    rowContainer.meta.height = getChildrenMax(rowContainer.children, 'height', root);
  });
}

function dfs(node, row, col, layout, positions) {
  const { type, children, meta } = node;

  if (children.length) {
    children.forEach((childId, index, arr) => {
      if (index > 0) {
        const { width: prev_width, height: prev_height } = layout[arr[index - 1]].meta;
        if ('DASHBOARD_ROW_TYPE' === type) {
          col += prev_width;
        }
        if (['DASHBOARD_COLUMN_TYPE', 'DASHBOARD_ROOT_TYPE'].indexOf(type) > -1) {
          row += prev_height % 2 === 0 ? (prev_height / 2)+1 : (prev_height + 1) / 2;
        }
      }
      dfs(layout[childId], row, col, layout, positions);
    });

    if ('DASHBOARD_ROW_TYPE' === type) {
      meta.width = getChildrenSum(children, 'width', layout);
      meta.height = getChildrenMax(children, 'height', layout);
    }

    if (['DASHBOARD_COLUMN_TYPE'].indexOf(type) > -1) {
      meta.width = getChildrenMax(children, 'width', layout);
      meta.height = getChildrenSum(children, 'height', layout);
    }
  } else {
    const { width, height, chartKey } = meta;
    positions[chartKey] = {
      colSpan: width,
      rowSpan: height % 2 === 0 ? (height / 2)+1 : (height + 1) / 2,
      row: row,
      col,
      chartKey,
    };
  }
}

function convertToLayout(positions) {
  const root = {
    'DASHBOARD_ROOT_ID': {
      version: 'v2',
      type: 'DASHBOARD_ROOT_TYPE',
      id: 'DASHBOARD_ROOT_ID',
      children: ['DASHBOARD_GRID_ID'],
    },
    'DASHBOARD_GRID_ID': {
      type: 'DASHBOARD_GRID_TYPE',
      id: 'DASHBOARD_GRID_ID',
      children: [],
    }
  };
  doConvert(positions, 0, root['DASHBOARD_GRID_ID'], root);

  // console.log(JSON.stringify(root));
  return root;
}

export function convertToPositions(layout) {
  let positions = {};

  const node = layout['DASHBOARD_ROOT_ID'];
  dfs(node, 1, 1, layout, positions);

  // console.log(JSON.stringify(positions));
  return positions;
}

const dash1 = [
  {
    "col": 1,
    "row": 0,
    "size_x": 16,
    "size_y": 16,
    "slice_id": "240"
  }
];
const dash2 = [
  {
    "col": 27,
    "row": 0,
    "size_x": 22,
    "size_y": 15,
    "slice_id": "44"
  },
  {
    "col": 17,
    "row": 0,
    "size_x": 10,
    "size_y": 15,
    "slice_id": "53"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 16,
    "size_y": 15,
    "slice_id": "240"
  }
];
const dash3 = [
  {
    "slice_id": "117",
    "size_x": 16,
    "size_y": 16,
    "v": 1,
    "col": 17,
    "row": 0
  },
  {
    "slice_id": "118",
    "size_x": 16,
    "size_y": 16,
    "v": 1,
    "col": 1,
    "row": 0
  },
  {
    "slice_id": "119",
    "size_x": 16,
    "size_y": 16,
    "v": 1,
    "col": 33,
    "row": 0
  }
];
const dash4 = [
  {
    "col": 1,
    "row": 12,
    "size_x": 48,
    "size_y": 12,
    "slice_id": "38"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 16,
    "size_y": 12,
    "slice_id": "42"
  },
  {
    "col": 17,
    "row": 0,
    "size_x": 32,
    "size_y": 12,
    "slice_id": "98"
  }
];
const dash5 = [
  {
    "col": 14,
    "row": 0,
    "size_x": 28,
    "size_y": 22,
    "slice_id": "38"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 13,
    "size_y": 8,
    "slice_id": "42"
  },
  {
    "col": 1,
    "row": 8,
    "size_x": 13,
    "size_y": 14,
    "slice_id": "98"
  }
];
const dash6= [
  {
    "col": 1,
    "row": 8,
    "size_x": 16,
    "size_y": 9,
    "slice_id": "45"
  },
  {
    "col": 17,
    "row": 0,
    "size_x": 16,
    "size_y": 17,
    "slice_id": "51"
  },
  {
    "col": 33,
    "row": 0,
    "size_x": 16,
    "size_y": 17,
    "slice_id": "57"
  },
  {
    "col": 1,
    "row": 4,
    "size_x": 16,
    "size_y": 4,
    "slice_id": "293"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 16,
    "size_y": 4,
    "slice_id": "294"
  }
];
const dash_annotation = [
  {
    "col": 22,
    "row": 12,
    "size_x": 11,
    "size_y": 11,
    "slice_id": "212"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 32,
    "size_y": 12,
    "slice_id": "213"
  },
  {
    "col": 1,
    "row": 12,
    "size_x": 10,
    "size_y": 11,
    "slice_id": "214"
  },
  {
    "col": 11,
    "row": 12,
    "size_x": 11,
    "size_y": 11,
    "slice_id": "215"
  },
  {
    "col": 33,
    "row": 14,
    "size_x": 16,
    "size_y": 9,
    "slice_id": "282"
  },
  {
    "col": 33,
    "row": 0,
    "size_x": 16,
    "size_y": 14,
    "slice_id": "283"
  }
];
const dash_wd_bank = [
  {
    "col": 1,
    "row": 0,
    "size_x": 8,
    "size_y": 8,
    "slice_id": "175"
  },
  {
    "col": 1,
    "row": 8,
    "size_x": 8,
    "size_y": 8,
    "slice_id": "176"
  },
  {
    "col": 37,
    "row": 0,
    "size_x": 12,
    "size_y": 28,
    "slice_id": "177"
  },
  {
    "col": 1,
    "row": 16,
    "size_x": 24,
    "size_y": 12,
    "slice_id": "178"
  },
  {
    "col": 9,
    "row": 0,
    "size_x": 28,
    "size_y": 16,
    "slice_id": "179"
  },
  {
    "col": 17,
    "row": 28,
    "size_x": 32,
    "size_y": 16,
    "slice_id": "180"
  },
  {
    "col": 25,
    "row": 16,
    "size_x": 12,
    "size_y": 12,
    "slice_id": "181"
  },
  {
    "col": 1,
    "row": 28,
    "size_x": 16,
    "size_y": 16,
    "slice_id": "182"
  },
  {
    "col": 33,
    "row": 44,
    "size_x": 16,
    "size_y": 16,
    "slice_id": "183"
  },
  {
    "col": 1,
    "row": 44,
    "size_x": 32,
    "size_y": 16,
    "slice_id": "184"
  }
];
const dash_birth = [
  {
    "col": 33,
    "row": 24,
    "size_x": 8,
    "size_y": 16,
    "slice_id": "186"
  },
  {
    "col": 41,
    "row": 24,
    "size_x": 8,
    "size_y": 16,
    "slice_id": "187"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 8,
    "size_y": 8,
    "slice_id": "188"
  },
  {
    "col": 9,
    "row": 0,
    "size_x": 8,
    "size_y": 8,
    "slice_id": "189"
  },
  {
    "col": 17,
    "row": 12,
    "size_x": 32,
    "size_y": 12,
    "slice_id": "190"
  },
  {
    "col": 1,
    "row": 24,
    "size_x": 32,
    "size_y": 16,
    "slice_id": "191"
  },
  {
    "col": 37,
    "row": 0,
    "size_x": 12,
    "size_y": 12,
    "slice_id": "192"
  },
  {
    "col": 17,
    "row": 0,
    "size_x": 20,
    "size_y": 12,
    "slice_id": "193"
  },
  {
    "col": 1,
    "row": 8,
    "size_x": 16,
    "size_y": 16,
    "slice_id": "194"
  },
  {
    "col": 1,
    "row": 40,
    "size_x": 32,
    "size_y": 16,
    "slice_id": "195"
  }
];
const dash_misc = [
  {
    "col": 1,
    "row": 28,
    "size_x": 24,
    "size_y": 16,
    "slice_id": "172"
  },
  {
    "col": 1,
    "row": 8,
    "size_x": 24,
    "size_y": 20,
    "slice_id": "173"
  },
  {
    "col": 25,
    "row": 8,
    "size_x": 24,
    "size_y": 16,
    "slice_id": "174"
  },
  {
    "col": 33,
    "row": 0,
    "size_x": 16,
    "size_y": 8,
    "slice_id": "185"
  },
  {
    "col": 25,
    "row": 24,
    "size_x": 24,
    "size_y": 20,
    "slice_id": "198"
  },
  {
    "col": 1,
    "row": 0,
    "size_x": 32,
    "size_y": 8,
    "slice_id": "199"
  },
  {
    "col": 1,
    "row": 44,
    "size_x": 24,
    "size_y": 16,
    "slice_id": "207"
  }
];
