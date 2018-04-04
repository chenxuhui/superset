import React from 'react';
import PropTypes from 'prop-types';
import ParentSize from '@vx/responsive/build/components/ParentSize';

import { componentShape } from '../util/propShapes';
import DashboardComponent from '../containers/DashboardComponent';
import DragDroppable from './dnd/DragDroppable';

import {
  GRID_GUTTER_SIZE,
  GRID_COLUMN_COUNT,
} from '../util/constants';

const propTypes = {
  depth: PropTypes.number.isRequired,
  gridComponent: componentShape.isRequired,
  handleComponentDrop: PropTypes.func.isRequired,
  resizeComponent: PropTypes.func.isRequired,
};

const defaultProps = {
};

class DashboardGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isResizing: false,
      rowGuideTop: null,
    };

    this.handleResizeStart = this.handleResizeStart.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleResizeStop = this.handleResizeStop.bind(this);
    this.getRowGuidePosition = this.getRowGuidePosition.bind(this);
  }

  getRowGuidePosition(resizeRef) {
    if (resizeRef && this.grid) {
      return resizeRef.getBoundingClientRect().bottom - this.grid.getBoundingClientRect().top - 1;
    }
    return null;
  }

  handleResizeStart({ ref, direction }) {
    let rowGuideTop = null;
    if (direction === 'bottom' || direction === 'bottomRight') {
      rowGuideTop = this.getRowGuidePosition(ref);
    }

    this.setState(() => ({
      isResizing: true,
      rowGuideTop,
    }));
  }

  handleResize({ ref, direction }) {
    if (direction === 'bottom' || direction === 'bottomRight') {
      this.setState(() => ({ rowGuideTop: this.getRowGuidePosition(ref) }));
    }
  }

  handleResizeStop({ id, widthMultiple: width, heightMultiple: height }) {
    this.props.resizeComponent({ id, width, height });

    this.setState(() => ({
      isResizing: false,
      rowGuideTop: null,
    }));
  }

  render() {
    const { gridComponent, handleComponentDrop, depth, cells } = this.props;
    const { isResizing, rowGuideTop } = this.state;

    return (
      <div className="grid-container" ref={(ref) => { this.grid = ref; }}>
        <ParentSize>
          {({ width }) => {
            // account for (COLUMN_COUNT - 1) gutters
            const columnPlusGutterWidth = (width + GRID_GUTTER_SIZE) / GRID_COLUMN_COUNT;
            const columnWidth = columnPlusGutterWidth - GRID_GUTTER_SIZE;

            return width < 50 ? null : (
              <div className="grid-content">
                {gridComponent.children.map((id, index) => (
                  <DashboardComponent
                    key={id}
                    id={id}
                    parentId={gridComponent.id}
                    depth={depth + 1}
                    index={index}
                    availableColumnCount={GRID_COLUMN_COUNT}
                    columnWidth={columnWidth}
                    cells={cells}
                    onResizeStart={this.handleResizeStart}
                    onResize={this.handleResize}
                    onResizeStop={this.handleResizeStop}
                  />
                ))}

                {/* render an empty drop target */}
                {gridComponent.children.length === 0 &&
                  <DragDroppable
                    component={gridComponent}
                    depth={depth}
                    parentComponent={null}
                    index={0}
                    orientation="column"
                    onDrop={handleComponentDrop}
                    className="empty-grid-droptarget"
                  >
                    {({ dropIndicatorProps }) => dropIndicatorProps &&
                      <div {...dropIndicatorProps} />}
                  </DragDroppable>}

                {isResizing && Array(GRID_COLUMN_COUNT).fill(null).map((_, i) => (
                  <div
                    key={`grid-column-${i}`}
                    className="grid-column-guide"
                    style={{
                      left: (i * GRID_GUTTER_SIZE) + (i * columnWidth),
                      width: columnWidth,
                    }}
                  />
                ))}

                {isResizing && rowGuideTop &&
                  <div
                    className="grid-row-guide"
                    style={{
                      top: rowGuideTop,
                      width,
                    }}
                  />}
              </div>
            );
          }}
        </ParentSize>
      </div>
    );
  }
}

DashboardGrid.propTypes = propTypes;
DashboardGrid.defaultProps = defaultProps;

export default DashboardGrid;
