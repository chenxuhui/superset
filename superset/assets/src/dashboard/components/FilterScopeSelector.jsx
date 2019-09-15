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

import getFilterScopeNodesTree from '../util/getFilterScopeNodesTree';
import FilterScopeTree from './FilterScopeTree'
import { DASHBOARD_ROOT_ID } from '../../../../static/assets/src/dashboard/util/constants'

const propTypes = {
  // from props
  layout: PropTypes.object.isRequired,
  chartId: PropTypes.number.isRequired,
  componentId: PropTypes.string.isRequired,

  // from redux
  filterImmuneSlices: PropTypes.arrayOf(PropTypes.number).isRequired,
  filterImmuneSliceFields: PropTypes.object.isRequired,
  setDirectPathToChild: PropTypes.func.isRequired,
};

export default class FilterScopeSelector extends React.PureComponent {
  constructor(props) {
    super(props);

    this.nodes = getFilterScopeNodesTree(props.layout)
    this.state = {
      filterText: '',
      nodesFiltered: this.nodes,
      checked: [],
      expanded: [],
    };

    this.onCheck = this.onCheck.bind(this);
    this.onExpand = this.onExpand.bind(this);
  }

  onCheck(checked) {
    this.setState({ checked });
  }

  onExpand(expanded) {
    this.setState({ expanded });
  }

  onFilterChange(e) {
    this.setState({ filterText: e.target.value }, this.filterTree);
  }

  filterTree() {
    // Reset nodes back to unfiltered state
    if (!this.state.filterText) {
      this.setState(prevState => ({
        nodesFiltered: prevState.nodes,
      }));

      return;
    }

    const nodesFiltered = prevState => (
      { nodesFiltered: prevState.nodes.reduce(this.filterNodes, []) }
    );

    this.setState(nodesFiltered);
  }

  filterNodes(filtered, node) {
    const { filterText } = this.state;
    const children = (node.children || []).reduce(this.filterNodes, []);

    if (
      // Node's label matches the search string
      node.label.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1 ||
      // Or a children has a matching node
      children.length
    ) {
      filtered.push({ ...node, children });
    }

    return filtered;
  }

  render() {
    const {
      checked,
      expanded,
      filterText,
      nodesFiltered,
    } = this.state;

    return (
      <div className="filter-scope-selector">
        <input
          className="filter-text"
          placeholder="Search..."
          type="text"
          value={filterText}
          onChange={this.onFilterChange}
        />
        <p />
        <FilterScopeTree
          nodes={nodesFiltered}
          checked={checked}
          expanded={expanded}
          onCheck={this.onCheck}
          onExpand={this.onExpand}
        />
      </div>
    )
  }
}

FilterScopeSelector.propTypes = propTypes;
