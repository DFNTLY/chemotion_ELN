import React from 'react';

const ChemotionLogo = ({ collapsed }) => {
  const width = collapsed ? "60" : "100";

  const styles = {
    blue: {
      fill: "#2495cf",
    },
    red: {
      fill: "#f55",
    },
    grey: {
      fill: "#4f5659",
    },
  };

  return (
    <svg
      width={width}
      height="60"
      viewBox={`0 0 ${width} 60`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Chemotion Logo</title>
      <g id="logo">
        {!collapsed && (
          <>
            <g id="full_name">
              <path
                id="h"
                style={styles.red}
                d="M41.577,25.456v3.626c.612-.712,1.344-1.07,2.194-1.07.437,0,.831.08,1.181.241.352.161.616.368.793.619.177.252.3.529.365.835.065.306.099.779.099,1.42v4.194h-1.898v-3.776c0-.748-.036-1.224-.108-1.427-.072-.203-.199-.362-.381-.48s-.41-.179-.686-.179c-.316,0-.596.076-.845.228-.249.152-.428.382-.544.69-.114.308-.173.762-.173,1.362v3.579h-1.898v-9.865h1.9v.002Z"
              />
              <path
                id="e"
                style={styles.red}
                d="M52.288,33.046l1.891.317c-.242.69-.627,1.217-1.152,1.579-.524.362-1.181.543-1.969.543-1.248,0-2.169-.406-2.77-1.219-.473-.65-.708-1.471-.708-2.463,0-1.183.311-2.112.932-2.782s1.407-1.007,2.357-1.007c1.067,0,1.909.351,2.525,1.054.616.703.912,1.777.885,3.227h-4.755c.014.561.166.998.459,1.308.293.313.656.467,1.093.467.298,0,.547-.08.751-.241.202-.163.354-.422.459-.781ZM52.395,31.134c-.013-.547-.155-.962-.426-1.248s-.598-.427-.986-.427c-.415,0-.757.15-1.026.451-.271.301-.403.708-.399,1.224h2.837Z"
              />
              <path
                id="m"
                style={styles.red}
                d="M55.685,28.173h1.75v.976c.625-.759,1.371-1.137,2.236-1.137.459,0,.858.094,1.194.284.336.19.614.473.831.855.316-.382.654-.665,1.019-.855.365-.188.755-.284,1.167-.284.527,0,.972.107,1.338.319.365.212.636.527.818.938.13.306.195.799.195,1.48v4.569h-1.898v-4.084c0-.708-.065-1.166-.195-1.373-.175-.27-.446-.404-.811-.404-.267,0-.515.08-.751.241-.235.161-.403.397-.506.71-.103.313-.155.804-.155,1.478v3.432h-1.898v-3.917c0-.695-.034-1.143-.101-1.347-.067-.201-.173-.353-.314-.451s-.334-.147-.578-.147c-.293,0-.556.078-.791.234-.233.156-.401.384-.504.679-.101.297-.152.788-.152,1.474v3.472h-1.898v-7.143h.002Z"
              />
              <path
                id="o"
                style={styles.red}
                d="M67.683,31.646c0-.628.155-1.237.466-1.824.311-.587.751-1.036,1.32-1.347.569-.31,1.205-.464,1.907-.464,1.084,0,1.974.351,2.666,1.054.692.703,1.04,1.59,1.04,2.662,0,1.081-.35,1.978-1.051,2.688-.699.712-1.582,1.067-2.644,1.067-.656,0-1.284-.147-1.88-.444-.596-.297-1.051-.73-1.36-1.302-.309-.572-.464-1.268-.464-2.09ZM69.628,31.746c0,.708.168,1.253.506,1.628.338.375.755.565,1.25.565s.91-.188,1.246-.565c.336-.377.504-.924.504-1.641,0-.699-.168-1.239-.504-1.615-.336-.377-.751-.565-1.246-.565s-.912.188-1.25.565c-.338.377-.506.92-.506,1.628Z"
              />
              <path
                id="t"
                style={styles.red}
                d="M79.859,28.174v1.507h-1.297v2.881c0,.583.011.922.038,1.02.025.096.081.176.168.239.087.062.195.094.32.094.175,0,.43-.06.764-.181l.161,1.467c-.441.188-.941.284-1.499.284-.343,0-.65-.058-.925-.172-.276-.114-.475-.263-.605-.444-.128-.181-.217-.427-.267-.737-.04-.219-.061-.663-.061-1.333v-3.115h-.872v-1.507h.872v-1.42l1.905-1.103v2.523h1.297v-.002Z"
              />
              <path
                id="i"
                style={styles.red}
                d="M81.176,27.204v-1.751h1.898v1.751h-1.898ZM81.176,35.321v-7.148h1.898v7.148h-1.898Z"
              />
              <path
                id="o_2"
                style={styles.red}
                d="M84.581,31.646c0-.628.155-1.237.466-1.824.311-.587.751-1.036,1.32-1.347.569-.31,1.205-.464,1.907-.464,1.085,0,1.974.351,2.666,1.054.692.703,1.04,1.59,1.04,2.662,0,1.081-.35,1.978-1.051,2.688-.699.712-1.582,1.067-2.644,1.067-.657,0-1.284-.147-1.88-.444-.596-.297-1.051-.73-1.36-1.302-.309-.572-.464-1.268-.464-2.09ZM86.525,31.746c0,.708.168,1.253.506,1.628.338.375.755.565,1.25.565s.91-.188,1.246-.565c.336-.377.504-.924.504-1.641,0-.699-.168-1.239-.504-1.615-.336-.377-.751-.565-1.246-.565s-.912.188-1.25.565c-.338.377-.506.92-.506,1.628Z"
              />
              <path
                id="n"
                style={styles.red}
                d="M99.989,35.321h-1.898v-3.646c0-.773-.04-1.271-.121-1.498-.081-.226-.213-.402-.394-.529-.181-.125-.401-.188-.659-.188-.329,0-.623.089-.885.27-.262.179-.439.418-.538.712-.096.297-.146.844-.146,1.641v3.238h-1.898v-7.148h1.763v1.05c.625-.808,1.414-1.21,2.364-1.21.419,0,.802.076,1.147.226.347.15.609.342.787.576.177.232.302.498.372.795.069.297.105.719.105,1.273v4.439Z"
              />
            </g>
            <g id="ELN">
              <path
                id="E"
                style={styles.red}
                d="M86.664,42.893v-4.955h3.686v.837h-2.682v1.099h2.496v.835h-2.496v1.349h2.778v.835h-3.782Z"
              />
              <path
                id="L"
                style={styles.red}
                d="M91.324,42.893v-4.915h1.004v4.08h2.496v.835h-3.5Z"
              />
              <path
                id="N"
                style={styles.red}
                d="M95.55,42.893v-4.955h.977l2.034,3.309v-3.309h.932v4.955h-1.008l-2.005-3.231v3.231h-.93Z"
              />
            </g>
          </>
        )}
        <g id="c_icon">
          <path
            id="outside"
            style={styles.grey}
            d="M47.961,48.942c-4.667,4.37-10.948,7.047-17.858,7.047-14.405,0-26.081-11.638-26.081-25.992S15.698,4.006,30.103,4.006c6.872,0,13.124,2.648,17.782,6.978l2.7-2.97C45.212,3.041,38.015,0,30.103,0,13.478,0,0,13.431,0,30s13.478,30,30.103,30c7.948,0,15.174-3.068,20.554-8.081l.002-.002-2.698-2.974Z"
          />
          <path
            id="middle"
            style={styles.blue}
            d="M30.183,47.187c-9.507,0-17.246-7.713-17.246-17.192s7.739-17.192,17.246-17.192c4.416,0,8.577,1.643,11.788,4.636l2.539-2.528c-3.885-3.666-8.949-5.681-14.327-5.681-11.488,0-20.834,9.316-20.834,20.767s9.346,20.769,20.834,20.769c5.378,0,10.442-2.012,14.325-5.681l-2.541-2.528c-3.204,2.988-7.365,4.629-11.784,4.629Z"
          />
          <path
            id="inside"
            style={styles.red}
            d="M34.331,32.389l2.102.529c-.441,1.719-1.232,3.032-2.377,3.935-1.145.902-2.543,1.355-4.197,1.355-1.712,0-3.103-.346-4.174-1.041-1.073-.694-1.889-1.699-2.447-3.017-.56-1.317-.84-2.731-.84-4.243,0-1.648.316-3.086.948-4.312.632-1.226,1.53-2.159,2.698-2.796,1.165-.636,2.449-.956,3.849-.956,1.589,0,2.924.404,4.009,1.208,1.082.806,1.837,1.94,2.263,3.401l-2.068.487c-.368-1.152-.903-1.99-1.602-2.514-.701-.525-1.582-.788-2.642-.788-1.221,0-2.241.293-3.061.875-.82.583-1.396,1.367-1.727,2.347-.332.982-.497,1.996-.497,3.039,0,1.347.197,2.521.589,3.524.394,1.005,1.006,1.755,1.835,2.251.831.496,1.73.746,2.698.746,1.176,0,2.173-.337,2.989-1.014.811-.681,1.364-1.686,1.654-3.017Z"
          />
        </g>
      </g>
    </svg>
  );
};

export default ChemotionLogo;
