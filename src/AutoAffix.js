import getOffset from 'dom-helpers/query/offset';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import React from 'react';
import mountable from 'react-prop-types/lib/mountable';

import Affix from './Affix';
import getContainer from './utils/getContainer';
import getDocumentHeight from './utils/getDocumentHeight';
import ownerDocument from './utils/ownerDocument';

/**
 * The `<AutoAffix/>` component wraps `<Affix/>` to automatically calculate
 * offsets in many common cases.
 */
class AutoAffix extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      offsetTop: null,
      offsetBottom: null,
      width: null
    };
  }


  componentDidMount() {
    this._isMounted = true;

    this._windowScrollListener = addEventListener(
      window, 'scroll', () => this.onWindowScroll()
    );
    this._documentClickListener = addEventListener(
      ownerDocument(this), 'click', () => this.onDocumentClick()
    );

    this.onUpdate();
  }

  componentWillUnmount() {
    this._isMounted = false;

    if (this._windowScrollListener) {
      this._windowScrollListener.remove();
    }
    if (this._documentClickListener) {
      this._documentClickListener.remove();
    }
  }

  onWindowScroll() {
    this.onUpdate();
  }

  onDocumentClick() {
    requestAnimationFrame(() => this.onUpdate());
  }

  onUpdate() {
    if (!this._isMounted) {
      return;
    }

    const {top: offsetTop, width} = getOffset(this.refs.positioner);

    const container = getContainer(this.props.container);
    let offsetBottom;
    if (container) {
      const documentHeight = getDocumentHeight(ownerDocument(this));
      const {top, height} = getOffset(container);
      offsetBottom = documentHeight - top - height;
    } else {
      offsetBottom = null;
    }

    this.updateState(offsetTop, offsetBottom, width);
  }

  updateState(offsetTop, offsetBottom, width) {
    if (
      offsetTop === this.state.offsetTop &&
      offsetBottom === this.state.offsetBottom &&
      width === this.state.width
    ) {
      return;
    }

    this.setState({offsetTop, offsetBottom, width});
  }

  render() {
    const {container, autoWidth, viewportOffsetTop, children, ...props} =
      this.props;
    const {offsetTop, offsetBottom, width} = this.state;

    let {affixStyle, bottomStyle} = this.props;
    if (autoWidth) {
      affixStyle = {width, ...affixStyle};
      bottomStyle = {width, ...bottomStyle};
    }

    return (
      <div>
        <div ref="positioner" />

        <Affix
          offsetTop={Math.max(offsetTop, viewportOffsetTop || 0)}
          viewportOffsetTop={viewportOffsetTop}
          offsetBottom={offsetBottom}
          affixStyle={affixStyle}
          bottomStyle={bottomStyle}
          {...props}
        >
          {children}
        </Affix>
      </div>
    );
  }
}

AutoAffix.propTypes = {
  ...Affix.propTypes,
  /**
   * The logical container node or component for determining offset from bottom
   * of viewport, or a function that returns it
   */
  container: React.PropTypes.oneOfType([
    mountable,
    React.PropTypes.func
  ]),
  /**
   * Automatically set width when affixed
   */
  autoWidth: React.PropTypes.bool
};

// This intentionally doesn't inherit default props from `<Affix>`, so that the
// auto-calculated offsets can apply.
AutoAffix.defaultProps = {
  autoWidth: true
};

export default AutoAffix;
