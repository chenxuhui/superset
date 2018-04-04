import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import DashboardComponent from '../../containers/DashboardComponent';
import DeleteComponentButton from '../DeleteComponentButton';
import DragDroppable from '../dnd/DragDroppable';
import DragHandle from '../dnd/DragHandle';
import HoverMenu from '../menu/HoverMenu';
import IconButton from '../IconButton';
import ResizableContainer from '../resizable/ResizableContainer';
import BackgroundStyleDropdown from '../menu/BackgroundStyleDropdown';
import WithPopoverMenu from '../menu/WithPopoverMenu';

import backgroundStyleOptions from '../../util/backgroundStyleOptions';
import { componentShape } from '../../util/propShapes';

import {
  BACKGROUND_TRANSPARENT,
  GRID_GUTTER_SIZE,
} from '../../util/constants';

const GUTTER = 'GUTTER';

const propTypes = {
  id: PropTypes.string.isRequired,
  parentId: PropTypes.string.isRequired,
  component: componentShape.isRequired,
  parentComponent: componentShape.isRequired,
  index: PropTypes.number.isRequired,
  depth: PropTypes.number.isRequired,
  cells: PropTypes.object.isRequired,

  // grid related
  availableColumnCount: PropTypes.number.isRequired,
  columnWidth: PropTypes.number.isRequired,
  minColumnWidth: PropTypes.number.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,

  // dnd
  deleteComponent: PropTypes.func.isRequired,
  handleComponentDrop: PropTypes.func.isRequired,
  updateComponents: PropTypes.func.isRequired,
};

const defaultProps = {
};

class Column extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
    };
    this.handleChangeBackground = this.handleUpdateMeta.bind(this, 'background');
    this.handleChangeFocus = this.handleChangeFocus.bind(this);
    this.handleDeleteComponent = this.handleDeleteComponent.bind(this);
  }

  handleDeleteComponent() {
    const { deleteComponent, id, parentId } = this.props;
    deleteComponent(id, parentId);
  }

  handleChangeFocus(nextFocus) {
    this.setState(() => ({ isFocused: Boolean(nextFocus) }));
  }

  handleUpdateMeta(metaKey, nextValue) {
    const { updateComponents, component } = this.props;
    if (nextValue && component.meta[metaKey] !== nextValue) {
      updateComponents({
        [component.id]: {
          ...component,
          meta: {
            ...component.meta,
            [metaKey]: nextValue,
          },
        },
      });
    }
  }

  render() {
    const {
      component: columnComponent,
      parentComponent,
      index,
      availableColumnCount,
      columnWidth,
      minColumnWidth,
      depth,
      onResizeStart,
      onResize,
      onResizeStop,
      handleComponentDrop,
      cells,
    } = this.props;

    const columnItems = [];

    (columnComponent.children || []).forEach((id, childIndex) => {
      columnItems.push(id);
      if (childIndex < columnComponent.children.length - 1) {
        columnItems.push(GUTTER);
      }
    });

    const backgroundStyle = backgroundStyleOptions.find(
      opt => opt.value === (columnComponent.meta.background || BACKGROUND_TRANSPARENT),
    );

    console.log('occupied/avail cols', columnComponent.meta.width, '/', availableColumnCount, 'min width', minColumnWidth)

    return (
      <DragDroppable
        component={columnComponent}
        parentComponent={parentComponent}
        orientation="column"
        index={index}
        depth={depth}
        onDrop={handleComponentDrop}
      >
        {({ dropIndicatorProps, dragSourceRef }) => (
          <ResizableContainer
            id={columnComponent.id}
            adjustableWidth
            adjustableHeight={false}
            widthStep={columnWidth}
            widthMultiple={columnComponent.meta.width}
            minWidthMultiple={minColumnWidth}
            maxWidthMultiple={availableColumnCount + (columnComponent.meta.width || 0)}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeStop={onResizeStop}
          >
            <WithPopoverMenu
              isFocused={this.state.isFocused}
              onChangeFocus={this.handleChangeFocus}
              disableClick
              menuItems={[
                <BackgroundStyleDropdown
                  id={`${columnComponent.id}-background`}
                  value={columnComponent.meta.background}
                  onChange={this.handleChangeBackground}
                />,
              ]}
            >
              <div
                className={cx(
                  'grid-column',
                  columnItems.length === 0 && 'grid-column--empty',
                  backgroundStyle.className,
                )}
              >
                <HoverMenu innerRef={dragSourceRef} position="top">
                  <DragHandle position="top" />
                  <DeleteComponentButton onDelete={this.handleDeleteComponent} />
                  <IconButton
                    onClick={this.handleChangeFocus}
                    className="fa fa-cog"
                  />
                </HoverMenu>

                {columnItems.map((componentId, itemIndex) => {
                  if (componentId === GUTTER) {
                    return <div key={`gutter-${itemIndex}`} style={{ height: GRID_GUTTER_SIZE }} />;
                  }

                return (
                  <DashboardComponent
                    key={componentId}
                    id={componentId}
                    parentId={columnComponent.id}
                    depth={depth + 1}
                    index={itemIndex / 2} // account for gutters!
                    availableColumnCount={columnComponent.meta.width}
                    columnWidth={columnWidth}
                    cells={cells}
                    onResizeStart={onResizeStart}
                    onResize={onResize}
                    onResizeStop={onResizeStop}
                  />
                );
              })}

                {dropIndicatorProps && <div {...dropIndicatorProps} />}
              </div>
            </WithPopoverMenu>
          </ResizableContainer>
        )}
      </DragDroppable>

    );
  }
}

Column.propTypes = propTypes;
Column.defaultProps = defaultProps;

export default Column;
