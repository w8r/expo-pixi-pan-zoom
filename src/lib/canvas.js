export function getZoomTransform({
  left,
  top,
  zoom,
  scaleX,
  scaleY,
  translateX,
  translateY
}) {
  return {
    translateX: left + zoom * translateX,
    translateY: top + zoom * translateY,
    scaleX: zoom * scaleX,
    scaleY: zoom * scaleY
  };
}

export function getAlignment(align) {
  switch (align) {
    case 'min':
    case 'start':
      return 'xMinYMin';

    case 'mid':
      return 'xMidYMid';

    case 'max':
    case 'end':
      return 'xMaxYMax';

    default:
      return align || 'xMidYMid';
  }
}

export function getTransform(vbRect, eRect, align, meetOrSlice) {
  // based on
  // https://svgwg.org/svg2-draft/coords.html#ComputingAViewportsTransform

  // Let vb-x, vb-y, vb-width, vb-height be the min-x, min-y, width and height
  // values of the viewBox attribute respectively.
  const vbX = vbRect.left || 0;
  const vbY = vbRect.top || 0;
  const vbWidth = vbRect.width;
  const vbHeight = vbRect.height;

  // Let e-x, e-y, e-width, e-height be the position and size of the element
  // respectively.
  const eX = eRect.left || 0;
  const eY = eRect.top || 0;
  const eWidth = eRect.width;
  const eHeight = eRect.height;

  // Initialize scale-x to e-width/vb-width.
  let scaleX = eWidth / vbWidth;

  // Initialize scale-y to e-height/vb-height.
  let scaleY = eHeight / vbHeight;

  // Initialize translate-x to e-x - (vb-x * scale-x).
  // Initialize translate-y to e-y - (vb-y * scale-y).
  let translateX = eX - vbX * scaleX;
  let translateY = eY - vbY * scaleY;

  // If align is 'none'
  if (align === 'none') {
    // Let scale be set the smaller value of scale-x and scale-y.
    // Assign scale-x and scale-y to scale.
    const scale = (scaleX = scaleY = Math.min(scaleX, scaleY));

    // If scale is greater than 1
    if (scale > 1) {
      // Minus translateX by (eWidth / scale - vbWidth) / 2
      // Minus translateY by (eHeight / scale - vbHeight) / 2
      translateX -= (eWidth / scale - vbWidth) / 2;
      translateY -= (eHeight / scale - vbHeight) / 2;
    } else {
      translateX -= (eWidth - vbWidth * scale) / 2;
      translateY -= (eHeight - vbHeight * scale) / 2;
    }
  } else {
    // If align is not 'none' and meetOrSlice is 'meet', set the larger of
    // scale-x and scale-y to the smaller.
    // Otherwise, if align is not 'none' and meetOrSlice is 'slice',
    // set the smaller of scale-x and scale-y to the larger.

    if (align !== 'none' && meetOrSlice === 'meet') {
      scaleX = scaleY = Math.min(scaleX, scaleY);
    } else if (align !== 'none' && meetOrSlice === 'slice') {
      scaleX = scaleY = Math.max(scaleX, scaleY);
    }

    // If align contains 'xMid', add (e-width - vb-width * scale-x) / 2 to
    // translate-x.
    if (align.includes('xMid')) {
      translateX += (eWidth - vbWidth * scaleX) / 2;
    }

    // If align contains 'xMax', add (e-width - vb-width * scale-x)
    // to translate-x.
    if (align.includes('xMax')) {
      translateX += eWidth - vbWidth * scaleX;
    }

    // If align contains 'yMid', add (e-height - vb-height * scale-y) / 2
    // to translate-y.
    if (align.includes('YMid')) {
      translateY += (eHeight - vbHeight * scaleY) / 2;
    }

    // If align contains 'yMax', add (e-height - vb-height * scale-y)
    // to translate-y.
    if (align.includes('YMax')) {
      translateY += eHeight - vbHeight * scaleY;
    }
  }

  // The transform applied to content contained by the element is given by
  // translate(translate-x, translate-y) scale(scale-x, scale-y).
  return {
    translateX,
    translateY,
    scaleX,
    scaleY,
    eRect
  };
}
