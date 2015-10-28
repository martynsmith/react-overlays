import getOffset from 'dom-helpers/query/offset';
import React from 'react';
import { findDOMNode } from 'react-dom';
import Affix from 'react-overlays/lib/Affix';

// Typically you'd probably want to actually measure the footer. This is just
// for the benefit of setting up the example.
function getDocumentHeight() {
  return Math.max(
    document.documentElement.offsetHeight || 0,
    document.height || 0,
    document.body.scrollHeight || 0,
    document.body.offsetHeight || 0
  );
}

class AffixExample extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      offsetBottom: null
    };
  }

  componentDidMount() {
    const {top, height} = getOffset(findDOMNode(this));
    const offsetBottom = getDocumentHeight() - top - height;

    if (offsetBottom !== this.state.offsetBottom) {
      this.setState({offsetBottom});
    }
  }

  render() {
    const {offsetBottom} = this.state;

    return (
      <div className='affix-example'>
        <Affix viewportOffsetTop={15} offsetBottom={offsetBottom}>
          <div className='panel panel-default'>
            <div className='panel-body'>
              I am an affixed element
            </div>
          </div>
        </Affix>
      </div>
    );
  }
}

export default AffixExample;
