import classNames from 'classnames';
import getHeight from 'dom-helpers/query/height';
import getOffset from 'dom-helpers/query/offset';
import getOffsetParent from 'dom-helpers/query/offsetParent';
import getScrollTop from 'dom-helpers/query/scrollTop';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import React from 'react';
import ReactDOM from 'react-dom';

import addEventListener from './utils/addEventListener';
import getDocumentHeight from './utils/getDocumentHeight';
import ownerDocument from './utils/ownerDocument';
import ownerWindow from './utils/ownerWindow';

/**
 * The `<Affix/>` component toggles `position: fixed;` on and off, emulating
 * the effect found with `position: sticky;`.
 */
class Affix extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      affixed: 'top',
      positionStyle: null
    };

    this._offsetTop = 0;
    this._needPositionUpdate = false;
  }

  componentDidMount() {
    this._isMounted = true;

    this._windowScrollListener = addEventListener(
      window, 'scroll', () => this.onWindowScroll()
    );
    this._documentClickListener = addEventListener(
      ownerDocument(this), 'click', () => this.onDocumentClick()
    );

    this.recalculateOffsetTop();
    this.onPositionUpdate();
  }

  componentWillReceiveProps() {
    this._needPositionUpdate = true;
  }

  componentDidUpdate() {
    if (this.state.affixed === 'top') {
      this.recalculateOffsetTop();
    }

    if (this._needPositionUpdate) {
      this._needPositionUpdate = false;
      this.onPositionUpdate();
    }
  }

  componentWillUnmount() {
    if (this._windowScrollListener) {
      this._windowScrollListener.remove();
    }
    if (this._documentClickListener) {
      this._documentClickListener.remove();
    }

    this._isMounted = false;
  }

  onWindowScroll() {
    this.onPositionUpdate();
  }

  onDocumentClick() {
    requestAnimationFrame(() => this.onPositionUpdate());
  }

  onPositionUpdate() {
    if (!this._isMounted) {
      return;
    }

    const {viewportOffsetTop} = this.props;
    const scrollTop = getScrollTop(ownerWindow(this));
    const positionTopMin = scrollTop + (viewportOffsetTop || 0);

    if (positionTopMin <= this.getOffsetTop()) {
      this.setState({
        affixed: 'top',
        positionStyle: null
      });
      return;
    }

    if (positionTopMin > this.getPositionTopMax()) {
      this.setState({
        affixed: 'bottom',
        positionStyle: {
          position: 'absolute'
        }
      }, () => {
        if (!this._isMounted) {
          return;
        }

        this.setState(({affixed}) => {
          if (affixed === 'bottom') {
            // Might have changed due to position update.
            const positionTopMax = this.getPositionTopMax();
            const offsetParent = getOffsetParent(ReactDOM.findDOMNode(this));
            const parentTop = getOffset(offsetParent).top;

            return {
              positionStyle: {
                position: 'absolute',
                top: positionTopMax - parentTop
              }
            };
          } else {
            return {};
          }
        });
      });
      return;
    }

    this.setState({
      affixed: 'affix',
      positionStyle: {
        position: 'fixed',
        top: viewportOffsetTop
      }
    });
  }

  getOffsetTop() {
    if (this.props.offsetTop === 'auto') {
      return this._offsetTop;
    }

    return this.props.offsetTop;
  }

  getPositionTopMax() {
    const node = ReactDOM.findDOMNode(this);

    const documentHeight = getDocumentHeight(ownerDocument(node));
    const height = getHeight(node);

    return documentHeight - height - this.props.offsetBottom;
  }

  recalculateOffsetTop() {
    this._offsetTop = getOffset(ReactDOM.findDOMNode(this)).top;
  }

  render() {
    const child = React.Children.only(this.props.children);
    const {className, style} = child.props;

    const {affixed, positionStyle} = this.state;

    let affixClassName;
    let affixStyle;
    if (affixed === 'top') {
      affixClassName = this.props.topClassName;
      affixStyle = this.props.topStyle;
    } else if (affixed === 'bottom') {
      affixClassName = this.props.bottomClassName;
      affixStyle = this.props.bottomStyle;
    } else {
      affixClassName = this.props.affixClassName;
      affixStyle = this.props.affixStyle;
    }

    return React.cloneElement(child, {
      className: classNames(affixClassName, className),
      style: {...positionStyle, ...affixStyle, ...style}
    });
  }
}

Affix.propTypes = {
  /**
   * Pixels to offset from top of screen when calculating position
   */
  offsetTop: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.oneOf(['auto'])
  ]),
  /**
   * When affixed, pixels to offset from top of viewport
   */
  viewportOffsetTop: React.PropTypes.number,
  /**
   * Pixels to offset from bottom of screen when calculating position
   */
  offsetBottom: React.PropTypes.number,
  /**
   * CSS class or classes to apply when at top
   */
  topClassName: React.PropTypes.string,
  /**
   * Style to apply when at top
   */
  topStyle: React.PropTypes.object,
  /**
   * CSS class or classes to apply when affixed
   */
  affixClassName: React.PropTypes.string,
  /**
   * Style to apply when affixed
   */
  affixStyle: React.PropTypes.object,
  /**
   * CSS class or classes to apply when at bottom
   */
  bottomClassName: React.PropTypes.string,
  /**
   * Style to apply when at bottom
   */
  bottomStyle: React.PropTypes.object
};

Affix.defaultProps = {
  offsetTop: 'auto',
  offsetBottom: 0
};

export default Affix;
