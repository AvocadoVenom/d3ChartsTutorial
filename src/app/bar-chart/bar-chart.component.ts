import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Axis, AxisDomain } from 'd3';
import * as d3 from 'd3';
import { Item, DataService } from '../data.service';

@Component({
  selector: 'app-bar-chart',
  template: `<div id="bar"><svg></svg></div>`,
  styles: [
    `div.tooltip {
      position: absolute;
      text-align: center;
      width: 80px;
      height: 40px;
      padding: 5px;
      font: 12px sans-serif;
      background: black;
      color: white;
      border: 0px;
      border-radius: 8px;
      pointer-events: none;
      vertical-align: middle;
      z-index: 10;
    }
    svg text.label {
      fill: black;
      font: 15px;
      font-weight: 400;
      text-anchor: middle;
    }`
  ],
  encapsulation: ViewEncapsulation.None
})
export class BarChartComponent implements OnInit {
  get height(): number {
    return parseInt(d3.select('body').style('height'), 10);
  }
  get width(): number {
    return parseInt(d3.select('body').style('width'), 10);
  }
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };
  get barWidth(): number {
    return this.width - this.margin.left - this.margin.right;
  }
  get barHeight(): number {
    return this.height - this.margin.top - this.margin.bottom;
  }

  // group containers
  private gx: any; // X axis
  private gy: any; // Y axis
  private bars: any; // Bars
  private labels: any; // Labels

  // Scales and Axis
  private xAxis: Axis<AxisDomain>;
  private xScale: any;
  private yAxis: Axis<AxisDomain>;
  private yScale: any;
  private tooltip: any;

  // Drawing containers
  private svg: any;
  private mainContainer: any;

  dataSource: Item[];
  total: number;

  constructor(private service: DataService) {
    this.dataSource = <Item[]>this.service.getData();
    this.total = this.dataSource.reduce((sum, it) => sum += it.abs, 0);
  }

  ngOnInit() {
    this.svg = d3.select('#bar').select('svg');
    this.xScale = d3.scaleBand();
    this.yScale = d3.scaleLinear();
    this.initSvg();

    this.tooltip = d3.select('#bar')
      .append('div')
      .attr('class', 'tooltip')
      .style('display', 'none')
      .style('opacity', 0);
  }

  private initSvg() {
    this.setSVGDimensions();
    this.mainContainer = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.gy = this.mainContainer.append('g')
      .attr('class', 'axis axis--y');

    this.gx = this.mainContainer.append('g')
      .attr('class', 'axis axis--x');

    this.draw();
    window.addEventListener('resize', this.resize.bind(this));
  }

  private drawBars() {
    this.bars = this.mainContainer.selectAll('.bar')
      .remove()
      .exit()
      .data(this.dataSource)
      .enter().append('rect')
      .attr('class', d => d.value > 0 ? 'bar bar--positive' : 'bar bar--negative');

    this.bars
      .attr('x', d => this.xScale(d.name))
      .attr('y', this.yScale(0))
      .attr('width', this.xScale.bandwidth())
      .transition()
      .ease(d3.easeBounce)
      .duration(1000)
      .delay((d, i) => i * 80)
      .attr('y', d => this.yScale(d.value))
      .attr('height', d => Math.abs(this.yScale(d.value) - this.yScale(0)));

    this.bars
      .on('mousemove', function (s) {
        const percent = (Math.abs(s.abs / this.total) * 100).toFixed(2) + '%';
        this.tooltip
          .style('top', (d3.event.layerY + 15) + 'px')
          .style('left', (d3.event.layerX) + 'px')
          .style('display', 'block')
          .style('opacity', 1)
          .style('height', '40px')
          .html('name: ' + s.name + '<br>' +
            'value: ' + s.value + '<br>' +
            'share: ' + percent);
      }.bind(this))
      .on('mouseover', function (data, i, arr) {
        const interval = 3;

        d3.select(arr[i])
          .transition()
          .ease(d3.easeBounce)
          .duration(150)
          .attr('fill', 'gray')
          .attr('x', d => this.xScale(d['name']) - interval)
          .attr('width', this.xScale.bandwidth() + interval * 2)
          .attr('y', d => this.yScale(d['value']) - interval)
          .attr('height', d => Math.abs(this.yScale(d['value']) - this.yScale(0)) + interval);

        d3.select(this.labels._groups[0][i])
          .transition()
          .ease(d3.easeBounce)
          .duration(150)
          .style('color', 'gray')
          .attr('y', d => this.yScale(d['value']) + (-5 - interval));
      }.bind(this))
      .on('mouseout', function (data, i, arr) {
        this.tooltip.style('display', 'none');
        this.tooltip.style('opacity', 0);

        d3.select(arr[i])
          .transition()
          .ease(d3.easeBounce)
          .duration(150)
          .attr('fill', 'black')
          .attr('x', d => this.xScale(d['name']))
          .attr('width', this.xScale.bandwidth())
          .attr('y', d => this.yScale(d['value']))
          .attr('y', d => this.yScale(d['value']))
          .attr('height', d => Math.abs(this.yScale(d['value']) - this.yScale(0)));

        d3.select(this.labels._groups[0][i])
          .transition()
          .ease(d3.easeBounce)
          .duration(150)
          .style('color', 'black')
          .attr('y', d => this.yScale(d['value']) - 5);
      }.bind(this));
  }

  private drawAxis() {
    this.gy.attr('transform', `translate(0, 0)`).call(this.yAxis);
    this.gx.attr('transform', `translate(0, ${this.yScale(0)})`).call(this.xAxis);
  }

  private setSVGDimensions() {
    this.svg
      .style('width', this.width)
      .style('height', this.height);
  }

  private setAxisScales() {
    this.xScale = d3.scaleBand();
    this.yScale = d3.scaleLinear();

    this.xScale
      .rangeRound([0, this.barWidth]).padding(.1)
      .domain(this.dataSource.map(d => d.name));
    this.yScale
      .range([this.barHeight, 0])
      .domain([0, Math.max(...this.dataSource.map(x => x.value))]);
    this.xAxis = d3.axisBottom(this.xScale);
    this.yAxis = d3.axisLeft(this.yScale);
  }

  private draw() {
    this.setAxisScales();
    this.drawAxis();
    this.drawBars();
    this.drawLabels();
  }

  resize() {
    this.setSVGDimensions();
    this.setAxisScales();
    this.repaint();
  }

  private repaint() {
    this.drawAxis();
    this.drawBars();
    this.drawLabels();
  }

  private drawLabels() {
    this.labels = this.mainContainer.selectAll('.label')
      .remove()
      .exit()
      .data(this.dataSource)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => this.xScale(d.name) + (this.xScale.bandwidth() / 2))
      .attr('y', d => this.yScale(d.value) + (d.value < 0 ? 15 : -5))
      .transition()
      .duration(1500)
      .delay((d, i) => 1000 + i * 100)
      .text(d => Math.floor(d.value));
  }
}
