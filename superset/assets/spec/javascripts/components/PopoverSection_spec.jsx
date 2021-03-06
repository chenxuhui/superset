import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

import PopoverSection from '../../../src/components/PopoverSection';

describe('PopoverSection', () => {
  const defaultProps = {
    title: 'Section Title',
    isSelected: true,
    onSelect: () => {},
    info: 'info section',
    children: <div />,
  };

  let wrapper;
  const factory = (overrideProps) => {
    const props = Object.assign({}, defaultProps, overrideProps || {});
    return shallow(<PopoverSection {...props} />);
  };
  beforeEach(() => {
    wrapper = factory();
  });
  it('renders', () => {
    expect(React.isValidElement(<PopoverSection {...defaultProps} />)).to.equal(true);
  });
  it('is show an icon when selected', () => {
    expect(wrapper.find('.fa-check')).to.have.length(1);
  });
  it('is show no icon when not selected', () => {
    expect(factory({ isSelected: false }).find('.fa-check')).to.have.length(0);
  });
});
