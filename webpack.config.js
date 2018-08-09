const webpack    = require('webpack');
const Visualizer = require('webpack-visualizer-plugin');

module.exports = {
    context: __dirname + '/src/frontend/js',
    entry:   './main.js',
    output:  {
        filename:          'main.js',
        path:              __dirname + '/dist/js',
        publicPath:        '/js/',
        sourceMapFilename: 'dnBOUAwY76qx3MmZxtHn.map'
    },
    module:  {
        rules: [
            {
                test:    /\.js$/,
                exclude: /node_modules/,
                use:     {
                    loader: 'babel-loader'
                }
            },
            {
                test:   /\.ejs$/,
                loader: 'ejs-loader'
            }
        ]
    },
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.ProvidePlugin({
            $:      'jquery',
            jQuery: 'jquery',
            _:      'underscore'
        }),
        new Visualizer({
            filename: '../webpack_stats.html'
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks:    1, // Must be greater than or equal to one
            minChunkSize: 999999999
        })
    ]
};
