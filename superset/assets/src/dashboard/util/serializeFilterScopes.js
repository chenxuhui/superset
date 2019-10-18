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
// input: { [id_column1]: values, [id_column2]: values }
// output: { id: { column1: values, column2: values } }
// dashboardFilter shape: {
//   chartId: PropTypes.number.isRequired,
//   componentId: PropTypes.string.isRequired,
//   directPathToFilter: PropTypes.arrayOf(PropTypes.string).isRequired,
//   isDateFilter: PropTypes.bool.isRequired,
//   isInstantFilter: PropTypes.bool.isRequired,
//   columns: PropTypes.object,
//   labels: PropTypes.object,
//   scopes: PropTypes.object,
// }
export default function serializeFilterScopes(dashboardFilters) {
  return Object.values(dashboardFilters).reduce(
    (map, { chartId, columns, scopes }) => {
      const scopesById = Object.values(columns).reduce(
        (scopesByColumn, column) => ({
          ...scopesByColumn,
          [column]: scopes[column],
        }),
        {},
      );

      return {
        ...map,
        [chartId]: scopesById,
      };
    },
    {},
  );
}
