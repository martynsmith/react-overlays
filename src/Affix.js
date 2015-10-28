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

class Affix extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      affixed: 'top',
      affixStyle: null
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
        affixStyle: null
      });
      return;
    }

    if (positionTopMin > this.getPositionTopMax()) {
      this.setState({
        affixed: 'bottom',
        affixStyle: {
          position: 'absolute'
        }
      }, () => {
        this.setState(({affixed}) => {
          if (affixed === 'bottom') {
            // Might have changed due to position update.
            const positionTopMax = this.getPositionTopMax();
            const offsetParent = getOffsetParent(ReactDOM.findDOMNode(this));
            const parentTop = getOffset(offsetParent).top;

            return {
              affixStyle: {
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
      affixStyle: {
        position: 'fixed',
        top: viewportOffsetTop
      }
    });
  }

  getOffsetTop() {
    if (this.props.offsetTop != null) {
      return this.props.offsetTop;
    }

    return this._offsetTop;
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

    const {affixed, affixStyle} = this.state;

    let affixClassName;
    if (affixed === 'top') {
      affixClassName = this.props.topClassName;
    } else if (affixed === 'bottom') {
      affixClassName = this.props.bottomClassName;
    } else {
      affixClassName = this.props.affixClassName;
    }

    return React.cloneElement(child, {
      className: classNames(affixClassName, className),
      style: {...affixStyle, ...style}
    });
  }
}

Affix.propTypes = {
  /**
   * Pixels to offset from top of screen when calculating position
   */
  offsetTop: React.PropTypes.number,
  /**
   * When affixed, distance from top of viewport
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
   * CSS class or classes to apply when affixed
   */
  affixClassName: React.PropTypes.string,
  /**
   * CSS class or classes to apply when at bottom
   */
  bottomClassName: React.PropTypes.string
};

Affix.defaultProps = {
  offsetBottom: 0
};

export default Affix;
