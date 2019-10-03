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

import { CHART_TYPE } from '../util/componentTypes';

export default function getChartIdsInFilterScope({
  filterId,
  filterScope,
  components,
}) {
  function traverse(chartIds, component, immuneChartIds) {
    if (!component) {
      return;
    }

    if (
      component.type === CHART_TYPE &&
      component.meta &&
      component.meta.chartId &&
      !immuneChartIds.includes(component.meta.chartId) &&
      filterId !== component.meta.chartId
    ) {
      chartIds.push(component.meta.chartId);
    } else if (component.children) {
      component.children.forEach(child =>
        traverse(chartIds, components[child], immuneChartIds),
      );
    }
  }

  const chartIds = [];
  const { scope: scopeComponentIds, immune: immuneChartIds } = filterScope;
  scopeComponentIds.forEach(componentId =>
    traverse(chartIds, components[componentId], immuneChartIds),
  );

  return chartIds;
}
