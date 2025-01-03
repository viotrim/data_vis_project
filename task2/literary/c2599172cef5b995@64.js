function _1(md){return(
md`# 琼瑶文学作品可视化`
)}

function _data(FileAttachment){return(
FileAttachment("data.csv").csv()
)}

function _3(data){return(
data.forEach(d => {
  // 分割日期字符串为年、月、日
  const [year, month, day] = d['完稿日期'].split('/').map(Number);
  // 创建一个新的 Date 对象，注意月份是从0开始计数的
  d.date = new Date(year, month - 1, day);
})
)}

function _4(data){return(
data.sort((a, b) => a.date - b.date)
)}

function _chart(d3,data)
{
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 2000;
  const margin = { top: 20, right: 0, bottom: 20, left: 100 }; // 添加边距以便有空间放置时间线
  const format = d3.format(",d");

  // Create a color scale (a color for each child of the root node and their descendants).
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.length + 1))

  // Create a partition layout.
  const partition = d3.partition()
      .size([height, width])
      .padding(1);

  // 创建比例尺
  const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d['字数']))])
      .range([100, width+100]);
  
  const yScale = d3.scaleTime()
      .domain([d3.min(data, d => d.date), d3.max(data, d => d.date)])
      .range([margin.top, height - margin.bottom]); // 注意这里的范围是反向的，以便时间从上到下增加
  
  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width+100)
      .attr("height", height)
      .attr("viewBox", [0, 0, width+100, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif");

  // 添加时间线到左侧
  svg.append("g")
      .attr("transform", `translate(${margin.left},${0})`)  
      .call(d3.axisLeft(yScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y"))); // 格式化为年份;

  // 定义矩形绘制函数
  function drawRectangles() {
    const g = svg.append("g")
      .attr("transform", `translate(100,0)`); // 留出时间线的空间

    const rectangles = g.selectAll("rect")
      .data(data)
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", d => yScale(d.date))
      .attr("width", d => xScale(Number(d['字数'])))
      .attr("height", (d, i, nodes) => {
        return i < data.length - 1 ? 
          yScale(data[i + 1].date) - yScale(d.date) : 
          height - yScale(d.date);
      })
     .attr("fill", (d, i) => color(i)); // 使用颜色方案给每个作品分配颜色

  // 添加标签
  g.selectAll("text")
    .data(data)
    .enter().append("text")
      .attr("x", 4)
      .attr("y", d => yScale(d.date) + 13)
      .text(d => `${d['作品名称']}\n${d['字数']} 字`);
}

  drawRectangles(); 


// 定义一个函数来绘制弯曲箭头和标签
function addCurvedArrowAndLabel(svg, year, label, xOffset, yOffset) {
  const date = new Date(year, 0, 1); // 创建一个该年的1月1日日期对象
  const yPos = yScale(date);

  // 绘制弯曲箭头 (使用贝塞尔曲线)
  svg.append("path")
    .attr("d", `M${margin.left},${yPos} C${margin.left + xOffset/2 },${yPos} ${width + margin.left - xOffset / 2},${yPos - yOffset /5} ${xOffset},${yOffset}`)
    .attr("stroke", "red")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrowhead)"); // 添加箭头

  // 添加标签
  svg.append("text")
    .attr("x", xOffset) // 放置在箭头末端旁边
    .attr("y", yOffset)
    .attr("dx", 10) // 标签距离箭头末端一点距离
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .text(label);
}

// 定义箭头标记
svg.append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "0 0 10 10")
  .attr("refX", "5")
  .attr("refY", "5")
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M 0 0 L 10 5 L 0 10 Z")
  .attr("fill", "red");

// 添加指定的事件和标签
addCurvedArrowAndLabel(svg, 1979, "与平鑫涛结婚", 700, 550);
addCurvedArrowAndLabel(svg, 1988, "第一次回大陆", 700, 950);
  
  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["data.csv", {url: new URL("./files/47942b9c5cb5dfcc2da24c7ab53fba7f57d1f05374821cd060b32ff3badbf85c4520b3507b28cee1095cbc126397be5be1129fbaba47ca11f8c05885b0da7057.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer()).define(["data"], _3);
  main.variable(observer()).define(["data"], _4);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  return main;
}
