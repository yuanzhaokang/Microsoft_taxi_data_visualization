// import * as d3 from 'd3';
// import {geoMercator, geoPath} from 'd3-geo';
import geoMercator from 'd3-geo/src/projection/mercator';
import geoPath from 'd3-geo/src/path/index';
import config from 'app/graphic/config';
import zrender from 'zrender/src/zrender';
import Circle from 'zrender/src/graphic/shape/Circle';
import * as L from 'leaflet';
import Group from 'zrender/src/container/Group';
import PathTool from 'zrender/src/tool/path';
import 'leaflet/dist/leaflet.css';
/**
 * Draw map using zrender, d3, leaflet and mapbox.
 */
class Map {
    constructor(opts) {
        this.projection = null;
        this.dom = opts.dom;
        this.zrDom = opts.zrDom;
        this.geojson = opts.geojson;
        this.map = null; // for leafletmap.
        this.center = [116.3809, 39.903415];

        if(!this.dom) {
            throw new Error("not dom element.");
            return;
        }

        if(!this.geojson) {
            throw new Error("not geojson");
            return;
        }

        this.initZr = this.initZr.bind(this);
        this.clearZr =this.clearZr.bind(this);
        this.disposeZr = this.disposeZr.bind(this);
    }

    initZr() {
        this.zr = zrender.init(this.zrDom, {
            width: getComputedStyle(this.dom).width.replace('px', ''),
            height: getComputedStyle(this.dom).height.replace('px', '')
        });
    }

    clearZr() {
        if(this.zr) {
            this.zr.clear();
        }
    }

    disposeZr() {
        if(this.zr) {
            this.zr.dispose();
        }
    }

    createMap() {
        if(!this.zr) {
            throw new Error("zrender init error");
        }

        let g = new Group();
        this.zr.add(g);
        let c = new Circle({
            shape:{
                cx:300,
                cy:300,
                r:50
            },
            style:{
                fill:'red'
            }
        });
        g.add(c);
        this.projection = geoMercator()
            .center(this.center)
            .scale(20000);
        let path = geoPath()
            .projection(this.projection);

        let features = this.geojson.features;

        for(let i = 0; i < features.length; i++) {
            let p = PathTool.createFromString(path(features[i]), {
                style: {
                    lineWidth: 1,
                    stroke: 'rgba(120, 120, 120, 0.8)'
                }
            });

            g.add(p);
        }

        return this;
    }

    createLeafletMap() {
        this.map = L.map(this.dom).setView(this.center.reverse(), 12);
        let tileLayer = L.tileLayer(config.map.url);
        tileLayer.addTo(this.map);
    }

    /**
     * [{id: id, trace:[{x, y}, {x, y}]}]
     * @param {Array[{id: id, trace:[{x, y}]}]} data
     */
    drawTrace(data, opts) {
        if(!this.zr) {
            throw new Error("zrender init error");
        }

        let g = new Group();
        this.zr.add(g);
        this.zr.configLayer(config.traceLevel, {
            motionBlur: true,
            lastFrameAlpha: 0.95
        });

        for(let i = 0; i < data.length; i++) {
            let { id, trace } = data[i];
            let c = new Circle({
                shape: {
                    cx: trace[0].x,
                    cy: trace[0].y,
                    r: 5
                },
                style: {
                    fill: 'blue'
                },
                zlevel: config.traceLevel,
                silent: true
            });

            let animator = null;

            if(trace[1]) {
                animator = c.animateShape(true)
                    .when(config.traceTime, {
                        cx: trace[1].x,
                        cy: trace[1].y
                    });
            }

            if(trace[2]) {
                for(let j = 2; j < trace.length; j++) {
                    animator.when(config.traceTime * j, {
                        cx: trace[j].x,
                        cy: trace[j].y
                    });
                }
            }

            if(animator) {
                animator.start();
            }

            this.zr.add(c);
        }
    }
}

export default Map;