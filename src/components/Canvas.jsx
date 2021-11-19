import React, { useState } from 'react';
import { GLView } from 'expo-gl'
import { PIXI } from 'expo-pixi';
import { Dimensions } from 'react-native';

export default function Canvas({ transform }) {
  const [app, setApp] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [gl, setGl] = useState(null);

  if (viewport) {
    requestAnimationFrame(() => {
      const { translateX, translateY, scaleX } = transform;
      console.log({ x: translateX, y: translateY, z: scaleX });
      viewport.setTransform(translateX, translateY, scaleX, scaleX);
      app.render();
      gl && gl.endFrameEXP();
    });
  }

  return (
    <GLView
      style={{
        flex: 1,
        borderColor: 'red',
        width: Dimensions.get('screen').width,
        borderWidth: 2
      }}
      onContextCreate={async context => {
        const app = new PIXI.Application({
          context,
          antialias: true,
          autoStart: false
        });
        const viewport = new PIXI.Container();
        // const sprite = await PIXI.Sprite.fromExpoAsync(
        //   'http://i.imgur.com/uwrbErh.png',
        // );
        // app.stage.addChild(sprite);

        setGl(gl);
        setApp(app);
        setViewport(viewport);

        const graphics = new PIXI.Graphics();

        app.stage.addChild(viewport);
        viewport.addChild(graphics);
        //app.stage.addChild(graphics);

        // Rectangle
        for (let i = 0; i < 2; i++) {
          graphics.beginFill(0xDE3249);
          graphics.drawRect(0, i * 510, 500, 500);
          graphics.endFill();
        }
      }}
    />
  );
}
