import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import DashboardGrid from '../components/DashboardGrid';

import {
  handleComponentDrop,
  resizeComponent,
} from '../actions';

function mapStateToProps({ undoableLayout }, ownProps) {
  return {
    layout: undoableLayout.present,
    cells: ownProps.cells,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    handleComponentDrop,
    resizeComponent,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardGrid);
