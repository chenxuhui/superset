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
import { Button } from 'react-bootstrap';
import { t } from '@superset-ui/translation';

import ModalTrigger from '../../components/ModalTrigger';
import FilterScope from '../containers/FilterScope'

const propTypes = {
  triggerNode: PropTypes.node.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default class FilterScopeModal extends React.PureComponent {
  constructor(props) {
    super(props);

    this.modal = null;
    this.close = this.close.bind(this);
    this.onSave = this.onSave.bind(this);
    this.setModalRef = this.setModalRef.bind(this);
  }

  setModalRef(ref) {
    this.modal = ref;
  }

  close() {
    this.modal.close();
  }

  onSave() {
    this.modal.close();
    this.props.onSave();
  }

  render() {
    return (
      <ModalTrigger
        ref={this.setModalRef}
        triggerNode={this.props.triggerNode}
        modalBody={
          <div className="delete-component-modal">
            <FilterScope
             chartId={this.props.chartId}
             componentId={this.props.componentId}
            />
            <div className="delete-modal-actions-container">
              <Button onClick={this.close}>{t('Cancel')}</Button>
              <Button bsStyle="primary" onClick={this.onSave}>
                {t('Save')}
              </Button>
            </div>
          </div>
        }
      />
    );
  }
}

FilterScopeModal.propTypes = propTypes;
