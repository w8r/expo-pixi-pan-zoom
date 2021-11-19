import React, { Component } from 'react';
import { View, PanResponder, Platform } from 'react-native';
import { distance as calcDistance, center as calcCenter } from '../lib/geometry';
import { getAlignment, getTransform, getZoomTransform } from '../lib/canvas';
//import { isWeb } from '../constants/device';

import PropTypes from 'prop-types';
import Canvas from './Canvas';

function getDerivedStateFromProps({
  top,
  left,
  zoom,
  align,
  width,
  height,
  vbWidth,
  vbHeight,
  meetOrSlice = 'meet',
  eRect = { width, height },
  vbRect = { width: vbWidth || width, height: vbHeight || height }
}, state) {
  const { top: currTop, left: currLeft, zoom: currZoom } = state;
  const viewBox = getTransform(vbRect, eRect, getAlignment(align), meetOrSlice);
  return {
    top: top || currTop,
    left: left || currLeft,
    zoom: zoom || currZoom,
    ...viewBox
  };
}

/**
 * This combines the pixi viewport and pixi container
 */
export default class Viewer extends Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    //graph: PropTypes.shape({}).isRequired,
    initialZoom: PropTypes.number,
    initialLeft: PropTypes.number,
    moveThreshold: PropTypes.number,
    doubleTapThreshold: PropTypes.number,
    doubleTapZoom: PropTypes.number,
    initialTop: PropTypes.number,
    lock: PropTypes.bool,
    wheelZoom: PropTypes.number
  };

  static defaultProps = {
    width: 200,
    height: 200,
    initialLeft: 0,
    initialZoom: 0,
    initialTop: 0,
    moveThreshold: 5,
    doubleTapThreshold: 5,
    lock: false,
    wheelZoom: 1.2,
    doubleTapZoom: 2
  };

  state = {
    error: null,
    loading: false,
    zoom: 0,
    left: 0,
    top: 0,
    isMoving: false,
    isZooming: false
  };

  constructor(props) {
    super();
    this.state = getDerivedStateFromProps(props, {
      zoom: props.initialZoom || 1,
      left: props.initialLeft || 0,
      top: props.initialTop || 0
    });
    const noop = () => { };
    const yes = () => true;
    const shouldRespond = (evt, { dx, dy }) => {
      const { moveThreshold = 5, doubleTapThreshold, lock } = this.props;
      return (
        !lock
        && (evt.nativeEvent.touches.length === 2
          || dx * dx + dy * dy >= moveThreshold
          || doubleTapThreshold)
      );
    };
    this.lastRelease = 0;
    this.panResponder = PanResponder.create({
      onPanResponderGrant: noop,
      onPanResponderTerminate: noop,
      onShouldBlockNativeResponder: yes,
      onPanResponderTerminationRequest: yes,
      onMoveShouldSetPanResponder: shouldRespond,
      onStartShouldSetPanResponder: shouldRespond,
      onMoveShouldSetPanResponderCapture: shouldRespond,
      onStartShouldSetPanResponderCapture: shouldRespond,
      onPanResponderMove: (evt, g) => {
        const {
          nativeEvent: { touches }
        } = evt;
        const { length } = touches;
        if (length === 1) {
          const [{ pageX, pageY }] = touches;
          this.processTouch(pageX, pageY);
        } else if (length === 2) {
          const [touch1, touch2] = touches;
          this.processPinch(
            touch1.pageX,
            touch1.pageY,
            touch2.pageX,
            touch2.pageY
          );
        } else return;
        evt.preventDefault();
      },
      onPanResponderRelease: ({ nativeEvent: { timestamp } }, { x0, y0 }) => {
        this.setState({
          isZooming: false,
          isMoving: false
        });
      }
    });
  }

  reset(zoom = 1, left = 0, top = 0) {
    this.setState({
      zoom,
      left,
      top
    });
  }

  processTouch(x, y) {
    const { isMoving, isZooming } = this.state;
    // const { isSelecting } = selectionContext();
    // console.log(useStore());
    // if (this.props.viewer.isSelecting) {
    //   console.log('sel move', x, y);
    //   return;
    // }
    if (!isMoving || isZooming) {
      const { top, left } = this.state;
      //requestAnimationFrame(() => {
      this.setState({
        isMoving: true,
        isZooming: false,
        initialLeft: left,
        initialTop: top,
        initialX: x,
        initialY: y
      })
      //});
    } else {
      const {
        initialX, initialY, initialLeft, initialTop, zoom
      } = this.state;

      const dx = x - initialX;
      const dy = y - initialY;

      //requestAnimationFrame(() => {
      this.setState({
        left: initialLeft + dx,
        top: initialTop + dy,
        zoom
      })
      //});
    }
  }

  zoomBy(dz, x, y) {
    const {
      top: initialTop, left: initialLeft, zoom: initialZoom
    } = this.state;

    const left = (initialLeft - x) * dz + x;
    const top = (initialTop - y) * dz + y;
    const zoom = initialZoom * dz;

    this.setState({
      zoom,
      left,
      top
    });
  }

  processPinch(x1, y1, x2, y2) {
    const distance = calcDistance(x1, y1, x2, y2);
    const { x, y } = calcCenter(x1, y1, x2, y2);
    const { isZooming } = this.state;

    if (!isZooming) {
      const { top, left, zoom } = this.state;
      this.setState({
        isZooming: true,
        initialX: x,
        initialY: y,
        initialTop: top,
        initialLeft: left,
        initialZoom: zoom,
        initialDistance: distance
      });
    } else {
      const {
        initialX,
        initialY,
        initialTop,
        initialLeft,
        initialZoom,
        initialDistance
      } = this.state;

      const touchZoom = distance / initialDistance;
      const dx = x - initialX;
      const dy = y - initialY;

      const left = (initialLeft + dx - x) * touchZoom + x;
      const top = (initialTop + dy - y) * touchZoom + y;
      const zoom = initialZoom * touchZoom;

      this.setState({ zoom, left, top });
    }
  }

  checkDoubleTap(timestamp, x, y, shift) {
    const { doubleTapThreshold, doubleTapZoom = 2 } = this.props;
    if (
      doubleTapThreshold
      && timestamp - this.lastRelease < doubleTapThreshold
    ) {
      this.zoomBy(shift ? 1 / doubleTapZoom : doubleTapZoom, x, y);
    }
    this.lastRelease = timestamp;
  }

  _onRecentered = ({ x, y, scale }) => {
    this.reset(scale, x, y);
  }

  render() {
    const { width, height } = this.props;
    return (
      <View {...this.panResponder.panHandlers}>
        <Canvas
          width={width}
          height={height}
          transform={getZoomTransform(this.state)}
          {...this.props}
        />
      </View>
    );
  };
}
