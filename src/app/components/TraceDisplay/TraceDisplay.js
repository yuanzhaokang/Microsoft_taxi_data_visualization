import { fire } from 'app/data/req';
import { getClassSet } from "app/util/ClassNameUtil";
import { routers } from 'app/config/config';
import { DatePicker, Button, Input, Row, Col } from 'app/components/widget/index';
import moment from 'moment';
import AppI18n from 'app/config/AppI18n';
import Map from 'app/graphic/Map';
import Util from 'app/util/util';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'app/components/TraceDisplay/tracedisplay.scss';

/**
 * Show the trace of taxi.
 */
class TraceDisplay extends Component {
    constructor(props) {
        super(props);

        this.canvas = null;
        this.map = null;
        this.success = this.success.bind(this);
        this.drawTrace = this.drawTrace.bind(this);
        this.error = this.error.bind(this);

        this.state = {
            id: null,
            date: moment('2008/02/02', 'YYYY/MM/DD')
        };
    }

    componentDidMount() {
        fire({ url: '/data/beijing.json', method: 'get' }, this.success, this.error);
    }

    render() {
        let classes = getClassSet(["trace-display"]);

        return (
            <div className={classes}>
                <Row className={getClassSet(['row'])}>
                    <Col className={getClassSet(['col'])} span={6}>
                        <Row>
                            <Col span={24}>
                                <Input value={this.state.id} onChange={(e) => {
                                    this.setState({ id: e.target.value })
                                }} />
                            </Col>
                            <Col span={24}>
                                <DatePicker defaultValue={moment('2008/01/02', 'YYYY/MM/DD')}
                                    value={this.state.date}
                                    onChange={(date, dateString) => {
                                        this.setState({ date: date });
                                    }} />
                            </Col>
                            <Col span={24}>
                                <Button onClick={(e) => {
                                    let info = {};
                                    info.date = this.state.date && this.state.date.valueOf();
                                    info.id = this.state.id;

                                    fire({
                                        url: routers.sv_trace_getTraceRoute,
                                        method: "post",
                                        data: info
                                    },
                                        this.drawTrace,
                                        this.error
                                    );
                                }}>{Util.getI18n(AppI18n.SEARCH)}</Button>
                            </Col>
                        </Row>
                    </Col>
                    <Col className={getClassSet(['col'])} span={18}>
                        <div className={getClassSet(["canvas"])} ref={(canvas) => {
                            this.canvas = canvas;
                        }}></div>
                    </Col>
                </Row>
            </div>
        );
    }

    success(data) {
        // 绘制地图
        this.map = new Map({
            dom: this.canvas,
            geojson: data,
        });

        this.map.createMap();
    }

    drawTrace(data) {
        data = JSON.parse(data);

        let input = {};
        input.id = data[0].id;
        input.trace = data.map((d) => {
            let coord = this.map.projection([d.lat, d.lng]);
            return { x: coord[0], y: coord[1] };
        });

        console.log(input);
        this.map.drawTrace([input]);
    }

    error(err) {
        console.error(err);
    }
}

const mapStateToProps = (state, ownProps) => {
    return {};
};

export default connect(mapStateToProps)(TraceDisplay);