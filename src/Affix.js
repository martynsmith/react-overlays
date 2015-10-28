import classNames from 'classnames';
import ownerDocument from 'dom-helpers/ownerDocument';
import getHeight from 'dom-helpers/query/height';
import getOffset from 'dom-helpers/query/offset';
import getOffsetParent from 'dom-helpers/query/offsetParent';
import getScrollTop from 'dom-helpers/query/scrollTop';
import requestAnimationFrame from 'dom-helpers/util/requestAnimationFrame';
import React from 'react';
import ReactDOM from 'react-dom';

import addEventListener from './utils/addEventListener';
import getDocumentHeight from './utils/getDocumentHeight';
import ownerWindow from './utils/ownerWindow';

class Affix extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      affixed: 'top',
      affixStyle: null
    };

    this._needPositionUpdate = false;
  }

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    this._isMounted = true;

    this._windowScrollListener = addEventListener(
      window, 'scroll', () => this.onWindowScroll()
    );
    this._documentClickListener = addEventListener(
      ownerDocument(node), 'click', () => this.onDocumentClick()
    );

    this.positionTopBase = getOffset(node).top;
    this.onPositionUpdate();
  }

  componentWillReceiveProps() {
    this._needPositionUpdate = true;
  }

  componentDidUpdate() {
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

    const {offsetTop} = this.props;
    const scrollTop = getScrollTop(ownerWindow(this));
    const positionTopMin = scrollTop + offsetTop;

    if (positionTopMin <= this.positionTopBase) {
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
        top: offsetTop
      }
    });
  }

  getPositionTopMax() {
    const node = ReactDOM.findDOMNode(this);

    const documentHeight = getDocumentHeight(ownerDocument(node));
    const height = getHeight(node);

    return documentHeight - height - this.props.offsetBottom;
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
  offsetTop: 0,
  offsetBottom: 0
};

export default Affix;
