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
import { Tabs, Tab, TabContent, Nav, NavItem, Button } from 'react-bootstrap';
import { t } from '@superset-ui/translation';

import { getAllFilterIds } from '../util/activeDashboardFilters';
import getFilterScopeNodesTree from '../util/getFilterScopeNodesTree';
import getFilterScopeParentNodes from '../util/getFilterScopeParentNodes';
import getCurrentScopeChartIds from '../util/getCurrentScopeChartIds';
import FilterScopeTree from './FilterScopeTree';
import {
  getDashboardFilterKey,
  getDashboardFilterByKey,
} from '../util/getDashboardFilterKey';
import { getFilterColorMap } from '../util/dashboardFiltersColorMap';
import FilterBadgeIcon from '../../components/FilterBadgeIcon';

const propTypes = {
  dashboardFilters: PropTypes.object.isRequired,
  layout: PropTypes.object.isRequired,
  filterImmuneSlices: PropTypes.arrayOf(PropTypes.number).isRequired,
  filterImmuneSliceFields: PropTypes.object.isRequired,

  setDirectPathToChild: PropTypes.func.isRequired,
  onCloseModal: PropTypes.func.isRequired,
};

export default class FilterScopeSelector extends React.PureComponent {
  constructor(props) {
    super(props);

    const {
      dashboardFilters,
      filterImmuneSlices,
      filterImmuneSliceFields,
      layout,
    } = props;

    // display checkbox tree of whole dashboard scope
    const nodes = getFilterScopeNodesTree(layout, getAllFilterIds());
    const expanded = getFilterScopeParentNodes(nodes, 1);
    const filterScopeMap = Object.values(dashboardFilters).reduce(
      (map, { chartId, columns }) => {
        const filterScopeByChartId = Object.keys(columns).reduce(
          (mapByChartId, columnName) => {
            const filterKey = getDashboardFilterKey(chartId, columnName);
            return {
              ...mapByChartId,
              [filterKey]: {
                // unfiltered nodes
                nodes,
                // filtered nodes in display if searchText is not empty
                nodesFiltered: nodes.slice(),
                checked: getCurrentScopeChartIds({
                  scopeComponentIds: ['ROOT_ID'], //dashboardFilters[chartId].scopes[columnName],
                  filterField: columnName,
                  filterImmuneSlices,
                  filterImmuneSliceFields,
                  components: layout,
                }),
                expanded,
              },
            };
          },
          {},
        );

        return {
          ...map,
          ...filterScopeByChartId,
        };
      },
      {},
    );

    const activeKey = Object.keys(filterScopeMap).length
      ? Object.keys(filterScopeMap)[0]
      : '';

    this.state = {
      activeKey,
      searchText: '',
      filterScopeMap,
    };

    this.filterNodes = this.filterNodes.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onCheck = this.onCheck.bind(this);
    this.onExpand = this.onExpand.bind(this);
    this.onSearchInputChange = this.onSearchInputChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onCheck(checked) {
    const { activeKey, filterScopeMap } = this.state;
    const updatedEntry = {
      ...filterScopeMap[activeKey],
      checked,
    };
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
    };
    this.setState(() => ({
      filterScopeMap: {
        ...filterScopeMap,
        [activeKey]: updatedEntry,
      },
    }));
  }

  onSearchInputChange(e) {
    this.setState({ searchText: e.target.value }, this.filterTree);
  }

  onChangeTab(activeKey) {
    this.setState({ activeKey });
  }

  onClose() {
    this.props.onCloseModal();
  }

  onSave() {
    console.log('i am current state', this.state.filterScopeMap);
    this.props.onCloseModal();
  }

  filterTree() {
    // Reset nodes back to unfiltered state
    if (!this.state.searchText) {
      this.setState(prevState => {
        const { activeKey, filterScopeMap } = prevState;
        const updatedEntry = {
          ...filterScopeMap[activeKey],
          nodesFiltered: filterScopeMap[activeKey].nodes,
        };
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
      };
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
    const filterKeys = Object.keys(filterScopeMap);
    const { dashboardFilters } = this.props;
    const dashboardFiltersColorMap = getFilterColorMap();

    return (
      <React.Fragment>
        <div className="filter-scope-container">
          <div className="filter-scope-header">
            <h4>{t('Configure filter scopes')}</h4>
            <input
              className="filter-text"
              placeholder="Search..."
              type="text"
              value={searchText}
              onChange={this.onSearchInputChange}
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
                {filterKeys.map(key => {
                  const [chartId, column] = getDashboardFilterByKey(key);
                  const label =
                    dashboardFilters[chartId].labels[column] || column;
                  const colorCode = dashboardFiltersColorMap[key];
                  return (
                    <NavItem
                      key={key}
                      eventKey={key}
                      className="filter-key-container"
                      title={label}
                    >
                      <FilterBadgeIcon colorCode={colorCode} />
                      <label>{label}</label>
                    </NavItem>
                  );
                })}
              </Nav>
              <TabContent animation>
                {filterKeys.map(key => (
                  <Tab eventKey={key}>
                    {
                      <FilterScopeTree
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
        <div className="dashboard-modal-actions-container">
          <Button onClick={this.onClose}>{t('Cancel')}</Button>
          <Button bsStyle="primary" onClick={this.onSave}>
            {t('Save')}
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

FilterScopeSelector.propTypes = propTypes;
