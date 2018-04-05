import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import GridCell from './GridCell';
import { slicePropShape } from '../reducers/propShapes';
import DashboardBuilder from '../v2/containers/DashboardBuilder';
import { convertToPositions } from '../v2/util/layoutConverter';

const propTypes = {
  dashboard: PropTypes.object.isRequired,
  layout: PropTypes.object.isRequired,
  datasources: PropTypes.object,
  charts: PropTypes.object.isRequired,
  slices: PropTypes.objectOf(slicePropShape).isRequired,
  filters: PropTypes.object,
  timeout: PropTypes.number,
  onChange: PropTypes.func,
  rerenderCharts: PropTypes.func,
  getFormDataExtra: PropTypes.func,
  exploreChart: PropTypes.func,
  exportCSV: PropTypes.func,
  fetchChart: PropTypes.func,
  saveSliceName: PropTypes.func,
  toggleExpandSlice: PropTypes.func,
  addFilter: PropTypes.func,
  getFilters: PropTypes.func,
  removeFilter: PropTypes.func,
  editMode: PropTypes.bool.isRequired,
};

const defaultProps = {
  onChange: () => ({}),
  getFormDataExtra: () => ({}),
  exploreChart: () => ({}),
  exportCSV: () => ({}),
  fetchChart: () => ({}),
  saveSliceName: () => ({}),
  toggleExpandSlice: () => ({}),
  addFilter: () => ({}),
  getFilters: () => ({}),
  removeFilter: () => ({}),
};

class GridLayout extends React.Component {
  constructor(props) {
    super(props);

    this.forceRefresh = this.forceRefresh.bind(this);
    this.updateSliceName = this.props.dashboard.dash_edit_perm ?
      this.updateSliceName.bind(this) : null;
  }

  getWidgetId(sliceId) {
    return 'widget_' + sliceId;
  }

  getWidgetHeight(sliceId) {
    const widgetId = this.getWidgetId(sliceId);
    if (!widgetId || !this.refs[widgetId]) {
      return 400;
    }
    return this.refs[widgetId].parentNode.clientHeight;
  }

  getWidgetWidth(sliceId) {
    const widgetId = this.getWidgetId(sliceId);
    if (!widgetId || !this.refs[widgetId]) {
      return 400;
    }
    return this.refs[widgetId].parentNode.clientWidth;
  }

  forceRefresh(sliceId) {
    return this.props.fetchChart(this.props.charts['slice_' + sliceId], true);
  }

  updateSliceName(sliceId, sliceName) {
    const key = 'slice_' + sliceId;
    const currentSlice = this.props.slices[key];
    if (!currentSlice || currentSlice.slice_name === sliceName) {
      return;
    }

    this.props.saveSliceName(currentSlice, sliceName);
  }

  isExpanded(sliceId) {
    return this.props.dashboard.metadata.expanded_slices &&
      this.props.dashboard.metadata.expanded_slices[sliceId];
  }

  componentDidUpdate(prevProps) {
    if (prevProps.editMode !== this.props.editMode) {
      this.props.rerenderCharts();
    }
  }
  render() {
    const cells = {};
    this.props.dashboard.sliceIds.forEach((sliceId) => {
      const key = `slice_${sliceId}`;
      const currentChart = this.props.charts[key];
      const currentSlice = this.props.slices[key];
      if (currentChart) {
        const currentDatasource = this.props.datasources[currentChart.form_data.datasource];
        const queryResponse = currentChart.queryResponse || {};
        cells[key] = (
          <div
            id={key}
            key={sliceId}
            className={cx('widget', `${currentSlice.viz_type}`, {'is-edit': this.props.editMode})}
            ref={this.getWidgetId(sliceId)}
          >
            <GridCell
              slice={currentSlice}
              chart={currentChart}
              datasource={currentDatasource}
              filters={this.props.filters}
              formData={this.props.getFormDataExtra(currentChart)}
              timeout={this.props.timeout}
              widgetHeight={this.getWidgetHeight(sliceId)}
              widgetWidth={this.getWidgetWidth(sliceId)}
              exploreChart={this.props.exploreChart}
              exportCSV={this.props.exportCSV}
              isExpanded={!!this.isExpanded(sliceId)}
              isLoading={currentChart.chartStatus === 'loading'}
              isCached={queryResponse.is_cached}
              cachedDttm={queryResponse.cached_dttm}
              toggleExpandSlice={this.props.toggleExpandSlice}
              forceRefresh={this.forceRefresh}
              updateSliceName={this.updateSliceName}
              addFilter={this.props.addFilter}
              getFilters={this.props.getFilters}
              removeFilter={this.props.removeFilter}
              editMode={this.props.editMode}
              annotationQuery={currentChart.annotationQuery}
              annotationError={currentChart.annotationError}
            />
          </div>
        );
      }
    });

    if (!this.props.editMode) {
      const positions = convertToPositions(this.props.layout);
      const staticCells = Object.keys(positions).map((key) => {
        const { row, col, colSpan, rowSpan, chartKey } = positions[key];
        const style = {
          'gridColumn': `${col} / span ${colSpan}`,
          'gridRow': `${row} / span ${rowSpan}`,
          position: 'relative',
          background: '#fff',
        };
        // console.log('style', chartKey, style.gridRow)

        return (
          <div
            className="grid-cell"
            style={style}
            key={'grid_' + chartKey}
          >
            {cells[key]}
          </div>
        );
      });

      return (<div className="grid-wrapper">
          {staticCells}
        </div>);
    } else {
      return (
        <DashboardBuilder
          cells={cells}
        />
      );
    }
  }
}

GridLayout.propTypes = propTypes;
GridLayout.defaultProps = defaultProps;

export default GridLayout;
