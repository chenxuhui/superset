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
import { DASHBOARD_ROOT_ID } from './constants';
import { CHART_TYPE, DASHBOARD_ROOT_TYPE, TAB_TYPE } from '../util/componentTypes'
import { isFilterBox } from '../util/activeDashboardFilters'

const FILTER_SCOPE_NODE_TYPES = [
  TAB_TYPE,
  DASHBOARD_ROOT_TYPE,
];

export default function getFilterScopeNodesTree(components = {}) {
  function traverse(currentNode) {
    if (!currentNode) {
      return;
    }

    const type = currentNode.type;
    if (
      CHART_TYPE === type &&
      currentNode.meta.chartId &&
      !isFilterBox(currentNode.meta.chartId)
    ) {
      return {
        value: currentNode.meta.chartId,
        label: currentNode.meta.sliceName || `${type} ${currentNode.meta.chartId}`,
        // showCheckbox: false,
      }
    }

    let children = [];
    if (currentNode.children && currentNode.children.length) {
      currentNode.children.forEach(child => {
        const cNode = traverse(components[child]);

        const childType = components[child].type;
        if (FILTER_SCOPE_NODE_TYPES.includes(childType)) {
          children.push(cNode);
        } else {
          children = children.concat(cNode);
        }
      });
    }

    if (FILTER_SCOPE_NODE_TYPES.includes(type)) {
      return {
        value: currentNode.id,
        label: type === DASHBOARD_ROOT_TYPE ? 'All dashboard' :
          (currentNode.meta && currentNode.meta.text) ? currentNode.meta.text : `${type} ${currentNode.id}`,
        children,
      }
    }

    return children;
  }

  if (Object.keys(components).length === 0) {
      return [];
  }

  const root = traverse(components[DASHBOARD_ROOT_ID]);
  return [{
    ...root,
  }];
}
