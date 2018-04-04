import { combineReducers } from 'redux';
import shortid from 'shortid';

import charts, { chart } from '../../chart/chartReducer';
import dashboard from './dashboard';
import datasources from './datasources';
import allSlices from './allSlices';
import undoableLayout from '../v2/reducers/index';
import { getParam } from '../../modules/utils';
import { applyDefaultFormData } from '../../explore/stores/store';
import { getColorFromScheme } from '../../modules/colors';

export function getInitialState(bootstrapData) {
  const { user_id, datasources, common } = bootstrapData;
  delete common.locale;
  delete common.language_pack;

  const dashboard = { ...bootstrapData.dashboard_data };
  let filters = {};
  try {
    // allow request parameter overwrite dashboard metadata
    filters = JSON.parse(getParam('preselect_filters') || dashboard.metadata.default_filters);
  } catch (e) {
    //
  }

  // Priming the color palette with user's label-color mapping provided in
  // the dashboard's JSON metadata
  if (dashboard.metadata && dashboard.metadata.label_colors) {
    const colorMap = dashboard.metadata.label_colors;
    for (const label in colorMap) {
      getColorFromScheme(label, null, colorMap[label]);
    }
  }

  // dashboard layout
  const undoableLayout = {
      past: [],
      present: dashboard.position_json,
      future: [],
    };
  delete dashboard.position_json;
  delete dashboard.css;

  // charts and allSlices
  const initCharts = {},
    allSlices = {};
  dashboard.slices.forEach((slice) => {
    const chartKey = 'slice_' + slice.slice_id;
    initCharts[chartKey] = { ...chart,
      chartKey,
      slice_id: slice.slice_id,
      form_data: slice.form_data,
      formData: applyDefaultFormData(slice.form_data),
    };

    allSlices[chartKey] = {
      slice_id: slice.slice_id,
      slice_url: slice.slice_url,
      slice_name: slice.slice_name,
      edit_url: slice.edit_url,
      viz_type: slice.form_data.viz_type,
      datasource: slice.datasource,
      description: slice.description,
      description_markeddown: slice.description_markeddown,
    };
  });
  dashboard.sliceIds = dashboard.slices.map(slice => (slice.slice_id));
  delete dashboard.slices;

  return {
    datasources,
    allSlices,
    charts: initCharts,
    dashboard: { filters, dashboard, userId: user_id, common, editMode: false, showBuilderPane: false },
    undoableLayout,
  };
}

const impressionId = function (state = '') {
  if (!state) {
    state = shortid.generate();
  }
  return state;
};

export default combineReducers({
  charts,
  dashboard,
  datasources,
  allSlices,
  undoableLayout,
  impressionId,
});
