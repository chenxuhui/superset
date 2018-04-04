import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DashboardBuilder from '../components/DashboardBuilder';

import {
  deleteTopLevelTabs,
  handleComponentDrop,
} from '../actions';

function mapStateToProps({ undoableLayout, dashboard }, ownProps) {
  return {
    layout: undoableLayout.present,
    cells: ownProps.cells,
    editMode: dashboard.editMode,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    deleteTopLevelTabs,
    handleComponentDrop,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardBuilder);
