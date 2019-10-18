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
import { CHART_TYPE, TAB_TYPE } from './componentTypes';

// input [
//   {value, label, children: []},
// ],
//
// output {
//   filterKey1: { scope: [tab1, tab2], immune: [chart1, chart2] }
//   filterKey2: { scope: [tab1, tab2], immune: [chart1, chart2] }
// }
export default function getFilterScopeFromNodesTree({
  nodes = {},
  checkedChartIds = [],
}) {
  console.log('i got nodes', nodes);
  console.log('checked ids', checkedChartIds)

  function traverse({ currentNode }) {
    if (!currentNode) {
      return {};
    }

    const { value: currentValue, children } = currentNode;
    const chartChildren = children.filter(({ type }) => type === CHART_TYPE);
    const tabChildren = children.filter(({ type }) => type === TAB_TYPE);

    const currentImmune = chartChildren
      .filter(({ value }) => !checkedChartIds.includes(value))
      .map(({ value }) => value);
    const tabScopes = tabChildren.reduce((map, child) => {
      const { value: tabValue } = child;
      return {
        ...map,
        [tabValue]: traverse({
          currentNode: child,
        }),
      };
    }, {});

    // if any chart type child is in scope, or
    // all sub-tabs are in scope
    if (
      chartChildren.some(({ value }) => checkedChartIds.includes(value)) ||
      Object.values(tabScopes).every(({ scope }) => scope.length)
    ) {
      return {
        scope: [currentValue],
        immune: [].concat(
          currentImmune,
          Object.values(tabScopes).map(({ immune }) => immune),
        ),
      };
    }

    // only some sub-tab in scope?
    return {
      scope: Object.values(tabScopes).map(({ scope }) => scope.length),
      immune: [].concat(
        currentImmune,
        Object.values(tabScopes).map(({ immune }) => immune),
      ),
    };
  }

  if (nodes && nodes.length) {
    return traverse({
      currentNode: nodes[0],
    });
  }

  return {};

  // const result = Object.keys(nodes).reduce((map, key) => {
  //   return {
  //     ...map,
  //     [key]: {
  //       scope: ['ROOT_ID'],
  //       immune: [],
  //     },
  //   };
  // }, {});
}
