"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let shapes = [];
let selectedShape = "line";
let isDrawing = false;
let startPoint = null;
let polygonPoints = [];
let circleCenter = null;

document.getElementById("shape").addEventListener("change", (event) => {
    selectedShape = event.target.value;
    polygonPoints = [];
    circleCenter = null;
});

document.getElementById("completePolygon").addEventListener("click", completePolygon);
document.getElementById("clearCanvas").addEventListener("click", clearCanvas);
document.getElementById("translateBtn").addEventListener("click", () => translateShape(20, 20));
document.getElementById("scaleBtn").addEventListener("click", () => scaleShape(1.2, 1.2));
document.getElementById("rotateBtn").addEventListener("click", () => rotateShape(15));

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", drawShape);
canvas.addEventListener("mouseup", finalizeShape);

function startDrawing(event) {
    const { x, y } = getMousePos(event);
    startPoint = vec2(x, y);

    if (selectedShape === "polygon") {
        polygonPoints.push(startPoint);
        redrawShapes();
        return;
    }

    isDrawing = true;

    if (selectedShape === "circle") {
        circleCenter = startPoint;
    }
}

function drawShape(event) {
    if (!isDrawing || selectedShape === "polygon") return;

    const { x, y } = getMousePos(event);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redrawShapes();

    ctx.beginPath();
    if (selectedShape === "line") {
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(x, y);
    } else if (selectedShape === "rectangle") {
        ctx.rect(startPoint[0], startPoint[1], x - startPoint[0], y - startPoint[1]);
    } else if (selectedShape === "triangle") {
        let midX = (startPoint[0] + x) / 2;
        let height = Math.abs(y - startPoint[1]);
        let thirdPoint = vec2(midX, startPoint[1] - height);
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(x, y);
        ctx.lineTo(thirdPoint[0], thirdPoint[1]);
        ctx.closePath();
    } else if (selectedShape === "circle" && circleCenter) {
        let radius = Math.sqrt(Math.pow(x - circleCenter[0], 2) + Math.pow(y - circleCenter[1], 2));
        ctx.arc(circleCenter[0], circleCenter[1], radius, 0, 2 * Math.PI);
    }
    ctx.stroke();
}

function finalizeShape(event) {
    if (selectedShape === "polygon") return;

    isDrawing = false;
    const { x, y } = getMousePos(event);

    if (selectedShape === "circle" && circleCenter) {
        const radius = Math.sqrt(Math.pow(x - circleCenter[0], 2) + Math.pow(y - circleCenter[1], 2));
        shapes.push({ type: "circle", center: circleCenter, radius: radius, transform: mat3() });
        circleCenter = null;
        redrawShapes();
        return;
    }

    const newShape = {
        type: selectedShape,
        points: selectedShape === "triangle" ? [
            startPoint, vec2(x, y), vec2((startPoint[0] + x) / 2, startPoint[1] - Math.abs(y - startPoint[1]))
        ] : [startPoint, vec2(x, y)],
        transform: mat3()
    };

    shapes.push(newShape);
    redrawShapes();
}

function completePolygon() {
    if (polygonPoints.length >= 3) {
        shapes.push({ type: "polygon", points: [...polygonPoints], transform: mat3() });
        polygonPoints = [];
        redrawShapes();
    }
}

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function redrawShapes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let shape of shapes) {
        ctx.beginPath();
        if (shape.type === "line") {
            ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            ctx.lineTo(shape.points[1][0], shape.points[1][1]);
        } else if (shape.type === "rectangle") {
            let w = shape.points[1][0] - shape.points[0][0];
            let h = shape.points[1][1] - shape.points[0][1];
            ctx.rect(shape.points[0][0], shape.points[0][1], w, h);
        } else if (shape.type === "triangle") {
            ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            ctx.lineTo(shape.points[1][0], shape.points[1][1]);
            ctx.lineTo(shape.points[2][0], shape.points[2][1]);
            ctx.closePath();
        } else if (shape.type === "polygon") {
            ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i][0], shape.points[i][1]);
            }
            ctx.closePath();
        } else if (shape.type === "circle") {
            ctx.arc(shape.center[0], shape.center[1], shape.radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
    }
}

// Apply Transformations
function applyTransform(matrix) {
    for (let shape of shapes) {
        if (shape.type === "circle") {
            let p = vec3(shape.center[0], shape.center[1], 1);
            let newP = mult(matrix, p);
            shape.center = vec2(newP[0], newP[1]);
        } else {
            for (let i = 0; i < shape.points.length; i++) {
                let p = vec3(shape.points[i][0], shape.points[i][1], 1);
                let newP = mult(matrix, p);
                shape.points[i] = vec2(newP[0], newP[1]);
            }
        }
    }
    redrawShapes();
}

// Translation
function translateShape(dx, dy) {
    let translationMatrix = mat3(
        1, 0, dx,
        0, 1, dy,
        0, 0, 1
    );
    applyTransform(translationMatrix);
}

// Scaling
function scaleShape(sx, sy) {
    let scaleMatrix = mat3(
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1
    );
    applyTransform(scaleMatrix);
}

// Rotation
function rotateShape(angle) {
    let theta = radians(angle);
    let rotationMatrix = mat3(
        Math.cos(theta), -Math.sin(theta), 0,
        Math.sin(theta), Math.cos(theta), 0,
        0, 0, 1
    );
    applyTransform(rotationMatrix);
}

// Clear Canvas
function clearCanvas() {
    shapes = [];
    polygonPoints = [];
    circleCenter = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
