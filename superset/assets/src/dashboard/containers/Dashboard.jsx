/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Dashboard from '../components/Dashboard';

import {
  addSliceToDashboard,
  removeSliceFromDashboard,
} from '../actions/dashboardState';
import { triggerQuery } from '../../chart/chartAction';
import { logEvent } from '../../logger/actions';
import { getActiveFilterFields } from '../util/activeDashboardFilters';
import getChartIdsInFilterScope from '../util/getChartIdsInFilterScope';

function mapStateToProps(state) {
  const {
    datasources,
    sliceEntities,
    charts,
    dashboardInfo,
    dashboardState,
    dashboardLayout,
    dashboardFilters,
    impressionId,
  } = state;

  const layout = dashboardLayout.present;
  const activeFilterFields = getActiveFilterFields();
  const filters = Object.keys(activeFilterFields).reduce(
    (mapByFilterId, filterId) => {
      const fields = activeFilterFields[filterId];
      const filterState = fields.reduce(
        (mapByFieldName, fieldName) => ({
          ...mapByFieldName,
          [fieldName]: {
            values: dashboardFilters[filterId].columns[fieldName],
            scope: getChartIdsInFilterScope({
              filterId: parseInt(filterId, 10),
              filterScope: dashboardFilters[filterId].scopes[fieldName],
              components: layout,
            }),
          },
        }),
        {},
      );

      return {
        ...mapByFilterId,
        [filterId]: filterState,
      };
    },
    {},
  );
  return {
    initMessages: dashboardInfo.common.flash_messages,
    timeout: dashboardInfo.common.conf.SUPERSET_WEBSERVER_TIMEOUT,
    userId: dashboardInfo.userId,
    dashboardInfo,
    dashboardState,
    charts,
    datasources,
    // filters prop: non-empty filter_box's selected value and scope.
    // When dashboard is first loaded into browser,
    // its value is from preselect_filters that dashboard owner saved in dashboard's meta data
    // When user start interacting with dashboard, it will be user picked values from all filter_box
    filters,
    slices: sliceEntities.slices,
    layout,
    impressionId,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(
      {
        addSliceToDashboard,
        removeSliceFromDashboard,
        triggerQuery,
        logEvent,
      },
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Dashboard);
