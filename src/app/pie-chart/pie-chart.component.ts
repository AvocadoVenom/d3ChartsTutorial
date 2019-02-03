import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Item, DataService } from '../data.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-pie-chart',
  template: `<div id='pie'><svg></svg></div>`,
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
    }`
  ],
  encapsulation: ViewEncapsulation.None
})
export class PieChartComponent implements OnInit {
  // Dimensions
  get height(): number {
    return parseInt(d3.select('body').style('height'), 10);
  }
  get width(): number {
    return parseInt(d3.select('body').style('width'), 10);
  }
  radius: number;

  // Arcs & pie
  private arc: any;
  private hoveredArc: any;
  private arcLabel: any;
  private pie: any;
  private slices: any;

  private color: any;

  // Drawing containers
  private svg: any;
  private mainContainer: any;

  private texts: any;

  dataSource: Item[];
  total: number;

  constructor(private service: DataService) {
    this.dataSource = this.service.getData();
    this.total = this.dataSource.reduce((sum, it) => sum += it.abs, 0);
  }

  ngOnInit() {
    this.svg = d3.select('#pie').select('svg');
    this.initSvg();
  }

  private initSvg() {
    this.setSVGDimensions();

    // Color scale.
    this.color = d3.scaleOrdinal(d3.schemeCategory10);

    this.mainContainer = this.svg.append('g')
      .attr('transform', 'translate(' + (this.radius) + ',' + (this.radius) + ')');

    this.pie = d3.pie()
      .sort(null)
      .value((d: any) => d.abs);

    this.draw();
    window.addEventListener('resize', this.resize.bind(this));
  }

  private setSVGDimensions() {
    this.radius = (Math.min(this.width, this.height)) / 2;

    this.svg
      .attr('width', 2 * this.radius)
      .attr('height', 2 * this.radius);

    this.svg.select('g')
      .attr('transform', 'translate(' + this.radius + ',' + this.radius + ')');
  }

  private draw() {
    this.setArcs();
    this.drawSlices();
    this.drawLabels();
  }

  private setArcs() {
    const thickness = (1 - 25 / 100);
    this.arc = d3.arc()
      .outerRadius(this.radius)
      .innerRadius(0);
    // .innerRadius(this.radius * thickness);

    this.arcLabel = d3.arc()
      .innerRadius(this.radius * .8)
      .outerRadius(this.radius * .8);
  }

  private drawSlices() {
    this.slices = this.mainContainer.selectAll('path')
      .remove()
      .exit()
      .data(this.pie(this.dataSource))
      .enter().append('g')
      .append('path')
      .attr('d', this.arc);
    this.slices
      .attr('fill', 'transparent')
      .attr('fill', (d, i) => this.color(i));
  }

  private drawLabels() {
    this.texts = this.mainContainer.selectAll('text')
      .remove()
      .exit()
      .data(this.pie(this.dataSource))
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${this.arcLabel.centroid(d)})`)
      .attr('dy', '0.35em');

    this.texts.append('tspan')
      .filter(d => (d.endAngle - d.startAngle) > 0.05)
      .attr('x', 0)
      .attr('y', 0)
      .style('font-weight', 'bold')
      .text(d => d.data.name);

    this.texts.append('tspan')
      .filter(d => (d.endAngle - d.startAngle) > 0.25)
      .attr('x', 0)
      .attr('y', '1.3em')
      .attr('fill-opacity', 0.7)
      .text(d => d.data.value.toLocaleString());
  }

  private resize() {
    this.setSVGDimensions();
    this.setArcs();
    this.repaint();
    this.drawLabels();
  }

  private repaint() {
    this.drawSlices();
    this.drawLabels();
  }
}
