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
import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, TabContent, Nav, NavItem } from 'react-bootstrap';

import getFilterScopeNodesTree from '../util/getFilterScopeNodesTree';
import getFilterScopeParentNodes from '../util/getFilterScopeParentNodes';
import FilterScopeTree from './FilterScopeTree'
import { CHART_TYPE, TAB_TYPE } from '../util/componentTypes'
import {
  getFilterColorKey,
  getFilterColorMap,
} from '../util/dashboardFiltersColorMap';
import FilterBadgeIcon from '../../components/FilterBadgeIcon'

const propTypes = {
  layout: PropTypes.object.isRequired,
  filterImmuneSlices: PropTypes.arrayOf(PropTypes.number).isRequired,
  filterImmuneSliceFields: PropTypes.object.isRequired,
  setDirectPathToChild: PropTypes.func.isRequired,

  // user selected filter:
  chartId: PropTypes.number.isRequired,
  componentId: PropTypes.string.isRequired,
  filterConfig: PropTypes.object.isRequired,
};

export default class FilterScopeSelector extends React.PureComponent {
  constructor(props) {
    super(props);

    const { filterConfig, layout } = props;
    const allChartIds = Object.values(layout)
      .filter(component => (component.type === CHART_TYPE))
      .map(chart => (chart.meta.chartId));
    const nodes = getFilterScopeNodesTree(layout);
    const allParentIds = getFilterScopeParentNodes(nodes);

    const { columns } = filterConfig;
    this.filterKeys = Object.keys(columns);
    const activeKey = this.filterKeys.length ? this.filterKeys[0] : '';
    this.filterScopeMap = this.filterKeys.reduce((map, key) => {
      return {
        ...map,
        [key]: {
          nodes,                         // unfiltered nodes
          nodesFiltered: nodes.slice(),  // filtered nodes if searchText is not empty
          checked: allChartIds,
          expanded: allParentIds,
        },
      }
    }, {});

    this.state = {
      activeKey,
      searchText: '',
      filterScopeMap: this.filterScopeMap,
    };

    this.filterNodes = this.filterNodes.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onCheck = this.onCheck.bind(this);
    this.onExpand = this.onExpand.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
  }

  onCheck(checked) {
    const { activeKey, filterScopeMap } = this.state;
    const updatedEntry = {
      ...filterScopeMap[activeKey],
      checked,
    }
    this.setState(() => ({
      filterScopeMap: {
        ...filterScopeMap,
        [activeKey]: updatedEntry,
      },
    }));
  }

  onExpand(expanded) {
    const { activeKey, filterScopeMap } = this.state;
    const updatedEntry = {
      ...filterScopeMap[activeKey],
      expanded,
    }
    this.setState(() => ({
      filterScopeMap: {
        ...filterScopeMap,
        [activeKey]: updatedEntry,
      },
    }));
  }

  onFilterChange(e) {
    this.setState({ searchText: e.target.value }, this.filterTree);
  }

  onChangeTab(activeKey) {
    this.setState({ activeKey });
  }

  filterTree() {
    // Reset nodes back to unfiltered state
    if (!this.state.searchText) {
      this.setState(prevState => {
        const { activeKey, filterScopeMap } = prevState;
        const updatedEntry = {
          ...filterScopeMap[activeKey],
          nodesFiltered: filterScopeMap[activeKey].nodes,
        }
        return {
          filterScopeMap: {
            ...filterScopeMap,
            [activeKey]: updatedEntry,
          },
        };
      });

      return;
    }

    const updater = prevState => {
      const { activeKey, filterScopeMap } = prevState;
      const nodesFiltered = filterScopeMap[activeKey].nodes.reduce(this.filterNodes, []);
      const updatedEntry = {
        ...filterScopeMap[activeKey],
        nodesFiltered,
      }
      return {
        filterScopeMap: {
          ...filterScopeMap,
          [activeKey]: updatedEntry,
        },
      };
    };

    this.setState(updater);
  }

  filterNodes(filtered, node) {
    const { searchText } = this.state;
    const children = (node.children || []).reduce(this.filterNodes, []);

    if (
      // Node's label matches the search string
      node.label.toLocaleLowerCase().indexOf(searchText.toLocaleLowerCase()) > -1 ||
      // Or a children has a matching node
      children.length
    ) {
      filtered.push({ ...node, children });
    }

    return filtered;
  }

  render() {
    const {
      activeKey,
      searchText,
      filterScopeMap,
    } = this.state;
    const { chartId, filterConfig } = this.props;
    const { labels } = filterConfig;
    const dashboardFiltersColorMap = getFilterColorMap();

    return (
      <div className="filter-scope-container">
        <div className="filter-scope-header">
          <h4>Select scope of this filter:</h4>
          <input
            className="filter-text"
            placeholder="Search..."
            type="text"
            value={searchText}
            onChange={this.onFilterChange}
          />
        </div>

        <Tabs
          id="filters-tabs-container"
          defaultActiveKey={activeKey}
          onSelect={this.onChangeTab}
          animation
          mountOnEnter
          unmountOnExit={false}
        >
          <div className="filters-scope-selector">
            <Nav
              className="nav-bar"
              bsStyle="pills"
              stacked
            >
              {this.filterKeys.map(key => {
                const colorKey = getFilterColorKey(chartId, key);
                const colorCode = dashboardFiltersColorMap[colorKey];
                return (
                  <NavItem
                    key={colorKey}
                    eventKey={key}
                    className="filter-key-container"
                    title={labels[key]}
                  >
                      <FilterBadgeIcon
                        colorCode={colorCode}
                      />
                    <label>{labels[key] || key}</label>
                </NavItem>);
              })}
            </Nav>
            <TabContent animation>
              {this.filterKeys.map(key => (
                <Tab eventKey={key}>
                  {<FilterScopeTree
                    nodes={filterScopeMap[key].nodesFiltered}
                    checked={filterScopeMap[key].checked}
                    expanded={filterScopeMap[key].expanded}
                    onCheck={this.onCheck}
                    onExpand={this.onExpand}
                  />
                  }
                </Tab>
              ))}
            </TabContent>
          </div>
        </Tabs>
      </div>
    )
  }
}

FilterScopeSelector.propTypes = propTypes;
