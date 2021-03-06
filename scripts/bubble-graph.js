const HEIGHT = 900, WIDTH = 900; // visualisation size
const AXIS_MARGIN_BOT = 40;
const AXIS_MARGIN_LEFT = 80;
const RANGE_MULTIPLIER_X = (WIDTH - 2 * AXIS_MARGIN_BOT) / WIDTH;
const RANGE_MULTIPLIER_Y = (HEIGHT - 2 * AXIS_MARGIN_LEFT) / HEIGHT;
const X_AXIS_BUBBLE = AXIS_MARGIN_LEFT, Y_AXIS_BUBBLE = WIDTH - AXIS_MARGIN_BOT;
const GetById = id => document.getElementById(id)
let DELAY = 1500//700;
const defaultConfig = {
    N: 100,
    N_EMPIRES: 10,
    RANGE: RangeXY(-10, 10, -10, 10),
    ITERATIONS: 1000,
    ALPHA: 0.5,
    BETA: 1,
    GAMMA: 0.1 * Math.PI,
    RESCALE: 'rescale-empires'
}
const svg = d3.select("#fun-container")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
const BASE_RANGE_BUBBLE_X = [-10, 10], BASE_RANGE_BUBBLE_Y = [-10, 10]
const xAxisBubbles = d3.scaleLinear()
    .domain(BASE_RANGE_BUBBLE_X)
    .range([AXIS_MARGIN_LEFT, WIDTH - AXIS_MARGIN_LEFT]);
const yAxisBubbles = d3.scaleLinear()
    .domain(BASE_RANGE_BUBBLE_Y)
    .range([AXIS_MARGIN_BOT, HEIGHT - AXIS_MARGIN_BOT]);
svg.append("g")
    .attr("class", "yaxis-bubble")
    .attr("transform", `translate(${X_AXIS_BUBBLE},0)`)
    .call(d3.axisLeft(yAxisBubbles))

svg.append("g")
    .attr("class", "xaxis-bubble")
    .attr("transform", `translate(0,${Y_AXIS_BUBBLE})`)
    .call(d3.axisBottom(xAxisBubbles));

const tooltip = d3.select("#fun-container")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white")

// -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
function showTooltip(d) {
    const args = `(${FormatValues(d.realX)},${FormatValues(d.realY)})`
    const divContent = `Id: #${d.id} <br>
    ${d.colonies == null ? "colony" : `metropolis with ${d.colonies.length} colonies`} <br>
    f${args} = ${FormatValues(d.value)}
    `
    tooltip
        .style("opacity", 1)
        .html(divContent)
        .style("left", (d3.mouse(this)[0] + 30) + "px")
        .style("top", (d3.mouse(this)[1] + 30) + "px")
}
function moveTooltip(d) {
    tooltip
        .style("left", (d3.mouse(this)[0] + 30) + "px")
        .style("top", (d3.mouse(this)[1] + 30) + "px")
}
function hideTooltip(d) {
    tooltip
        .style("opacity", 0)
}
function Mean(values) {
    return values.reduce((acc, cur) => acc + cur, 0) / values.length;
}

const MapDataForPlot = data => data.map((val, i) => { return { x: i / 4 + 1, y: val } })
function UpdateData(newData, range) {
    iter++
    const values = newData.map(n => n.value)
    avgs.push(Mean(values))
    bests.push(Miniumum(values))
    const dataForPlot = MapDataForPlot(avgs)
    const dataBestsForPlot = MapDataForPlot(bests)
    UpdateAvg(dataForPlot, dataBestsForPlot)
    const circle = svg.selectAll("circle").data(newData);
    circle.exit().remove();
    circle.enter().append("circle")
        .merge(circle)
        .transition()
        .duration(DELAY)
        .attr("class", "bubbles")
        .attr("r", d => d.r)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .style("fill", d => d.color)
    circle.on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip)


    const rangeX = RangeToArray(range.x).map(a => a * RANGE_MULTIPLIER_X)
    const rangeY = RangeToArray(range.y).map(a => a * RANGE_MULTIPLIER_Y)
    const AXIS_DELAY = 1
    yAxisBubbles.domain(rangeY)//.nice();
    xAxisBubbles.domain(rangeX)//.nice();
    svg.selectAll("g.yaxis-bubble")
        .transition().duration(AXIS_DELAY)
        .call(d3.axisLeft(yAxisBubbles).tickFormat(DetermineFormatForAxes(range.y)))


    svg.selectAll("g.xaxis-bubble")
        .transition().duration(AXIS_DELAY)
        .call(d3.axisBottom(xAxisBubbles).tickFormat(DetermineFormatForAxes(range.x)))
}
const FloatFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});
const MAX_VAL = 1000
const MIN_VAL = 0.001
const FormatValues = val => {
    const absoluteVal = math.abs(val)
    if (absoluteVal > MAX_VAL || absoluteVal < MIN_VAL) {
        return Number.parseFloat(val).toExponential(2)
    }
    return FloatFormatter.format(val)
}
const ColorBox = color => `<p class="color-box" style="background-color:${color};">⠀⠀⠀</p>`
function UpdateLabels(newInfo) {
    const IntegerFormatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    d3.select("#iteration").text(IntegerFormatter.format(iter / 4 + 1))
    d3.select("#empires-alive").text(newInfo.length)
    const optimum = newInfo.reduce((acc, cur) => acc.value > cur.value ? cur : acc, newInfo[0])
    d3.select("#best-empire-color").html(ColorBox(optimum.color))
    const args = `(${FormatValues(optimum.realX)},${FormatValues(optimum.realY)})`
    d3.select("#optimum-args").text(args)
    d3.select("#found-optimum").text(FormatValues(optimum.value))

}
function UpdateInfo(newInfo) {

    const header = `<b>Empires (${newInfo.length}):</b> <br> `;
    const info = header.concat(newInfo.map((nation) => `${ColorBox(nation.color)} 
    #${nation.id}
    colonies: ${nation.colonies.length} 
    value: ${FormatValues(nation.value)} <br>
    `).join(""))
    document.getElementById("info-container").innerHTML = info

    UpdateLabels(newInfo);

}
function DoSth() {
    const next = Data.next();
    if (next.done) {
        return;
    }
    const val = next.value;
    const nations = val.nations;
    const newInfo = nations.filter(n => n.colonies !== null)
    newInfo.sort((a, b) => b.colonies.length - a.colonies.length)
    UpdateInfo(newInfo)
    UpdateData(nations, val.range);
}
function SetRange(range) {
    GetById("minX").value = range.x.start
    GetById("maxX").value = range.x.stop
    GetById("minY").value = range.y.start
    GetById("maxY").value = range.y.stop
}
const MAX_RANGE = RangeXY(-1000, 1000, -1000, 1000)
function GetRange() {
    const minX = Relaxation(Number.parseFloat(GetById("minX").value), MAX_RANGE.x)
    const maxX = Relaxation(Number.parseFloat(GetById("maxX").value), MAX_RANGE.x)
    const minY = Relaxation(Number.parseFloat(GetById("minY").value), MAX_RANGE.y)
    const maxY = Relaxation(Number.parseFloat(GetById("maxY").value), MAX_RANGE.y)
    SetRange(RangeXY(minX, maxX, minY, maxY))
    if (minX >= maxX || minY >= maxY) {
        SetRange(defaultConfig.RANGE)
        return defaultConfig.RANGE
    }
    return RangeXY(minX, maxX, minY, maxY)
}
function SetDefaultValueConfigs() {
    document.getElementById("nations").value = defaultConfig.N
    document.getElementById("empires").value = defaultConfig.N_EMPIRES
    document.getElementById("iterations-number").value = defaultConfig.ITERATIONS
    document.getElementById("alpha").value = defaultConfig.ALPHA
    document.getElementById("beta").value = defaultConfig.BETA
    document.getElementById("gamma").value = FloatFormatter.format(defaultConfig.GAMMA)
    GetById("rescale-never").checked = false
    GetById("rescale-empires").checked = false
    GetById("rescale-nations").checked = false
    GetById(defaultConfig.RESCALE).checked = true
    SetFunctionToDefault()
    SetFormula()
}
const CreateObject = (obj) => {
    return obj;
}
function GetRescalingValue() {
    const rescaleValues = ["rescale-never", "rescale-empires", "rescale-nations"]
        .map(value => CreateObject({ value, checked: GetById(value).checked }))
    return rescaleValues.find(value => value.checked === true).value
}
function GetConfig() {
    const N = GetById("nations").value
    const N_EMPIRES = GetById("empires").value
    const ITERATIONS = GetById("iterations-number").value
    const ALPHA = GetById("alpha").value
    const BETA = GetById("beta").value
    const GAMMA = GetById("gamma").value
    const RANGE = GetRange()
    const RESCALE = GetRescalingValue()
    const FORMULA = GetFormula().toLowerCase()
    const config = { N, N_EMPIRES, ITERATIONS, ALPHA, BETA, GAMMA, RANGE, RESCALE, FORMULA }
    return config;
}

let intId = null;
let iter = 0
let Data;
let avgs = []
let bests = []
const SetStateButtonText = text => document.getElementById("State").innerText = text
function Resume() {
    intId = setInterval(DoSth, DELAY);
    SetStateButtonText("STOP")
}
function Stop() {
    clearInterval(intId)
    SetStateButtonText("RESUME")
    intId = null
}
function Reset() {
    Stop();
    UpdateDelayLabel();
    const config = GetConfig();
    intId = null;
    iter = 0
    avgs = []
    bests = []
    Data = GetData(config);
    Resume();
}
const MAX_DELAY = -1 * document.getElementById("Delay").min;
function UpdateDelayLabel() {
    d3.select("#DelayDisplay").text(`Speed: ${MAX_DELAY - DELAY}`)
}
function ChangeDelay() {
    DELAY = -1 * this.value
    UpdateDelayLabel();
    Stop()
    Resume()
}
function State() {
    if (intId) {
        Stop();
    }
    else {
        Resume();
    }
}
function SetFormula() {
    const functions = GetById("functions-select")
    const selected = functions.options[functions.selectedIndex].value;
    const selectedFunc = TestFunctions.find(e => e.name === selected)
    if (selectedFunc) {
        GetById("formula").value = selectedFunc.formula
        SetRange(selectedFunc.range)
    }
}
function SetFunctionToDefault() {
    const functions = GetById("functions-select")
    functions.options[0].selected = true
}
function SetFunctionToCustom() {
    const functions = GetById("functions-select")
    functions.options[functions.options.length - 1].selected = true
}
function GetFormula() {
    return GetById("formula").value
}
d3.select("#State").on("click", State);
d3.select("#Reset").on("click", Reset)
d3.select("#Delay").on("change", ChangeDelay)
d3.select("#Reset-params").on("click", SetDefaultValueConfigs)
d3.select("#functions-select").on("change", SetFormula)
d3.select("#formula").on("input", SetFunctionToCustom)
SetDefaultValueConfigs();
Reset();