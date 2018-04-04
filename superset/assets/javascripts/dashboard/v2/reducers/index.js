import undoable, { distinctState } from 'redux-undo';

import layout from './dashboard';

const undoableLayout = undoable(layout, {
  limit: 10,
  filter: distinctState(),
});

export default undoableLayout;
