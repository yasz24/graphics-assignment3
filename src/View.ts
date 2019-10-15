import { vec4, mat4, vec3, glMatrix } from "gl-matrix";
import * as WebGLUtils from "%COMMON/WebGLUtils";
import { Features } from "./Controller";
import { Stack } from "%COMMON/Stack"
import { Scenegraph } from "./Scenegraph";
import { VertexPNT, VertexPNTProducer } from "./VertexPNT";
import { ShaderLocationsVault } from "%COMMON/ShaderLocationsVault";
import { ScenegraphRenderer } from "./ScenegraphRenderer";
import { Mesh } from "%COMMON/PolygonMesh";
import { ObjImporter } from "%COMMON/ObjImporter"
import { ScenegraphJSONImporter } from "./ScenegraphJSONImporter"
import { LeafNode } from "./LeafNode";
import { TransformNode } from "./TransformNode";
import { SGNode } from "SGNode";
import { Material } from "%COMMON/Material";
import { GroupNode } from "./GroupNode";


/**
 * This class encapsulates the "view", where all of our WebGL code resides. This class, for now, also stores all the relevant data that is used to draw. This can be replaced with a more formal Model-View-Controller architecture with a bigger application.
 */


export class View {
    //the webgl rendering context. All WebGL functions will be called on this object
    private gl: WebGLRenderingContext;
    //an object that represents a WebGL shader
    private shaderProgram: WebGLProgram;

    //a projection matrix, that encapsulates how what we draw corresponds to what is seen
    private proj: mat4;

    //a modelview matrix, that encapsulates all the transformations applied to our object
    private modelview: Stack<mat4>;

    private scenegraph: Scenegraph<VertexPNT>;
    private shaderLocations: ShaderLocationsVault;

    private time: number;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;
        this.time = 0;
        this.modelview = new Stack<mat4>();
        this.scenegraph = null;
        //set the clear color
        this.gl.clearColor(0.9, 0.9, 0.7, 1);


        //Our quad is in the range (-100,100) in X and Y, in the "virtual world" that we are drawing. We must specify what part of this virtual world must be drawn. We do this via a projection matrix, set up as below. In this case, we are going to render the part of the virtual world that is inside a square from (-200,-200) to (200,200). Since we are drawing only 2D, the last two arguments are not useful. The default Z-value chosen is 0, which means we only specify the last two numbers such that 0 is within their range (in this case we have specified them as (-100,100))
        this.proj = mat4.ortho(mat4.create(), -100, 100, -100, 100, 0.1, 10000);

        //We must also specify "where" the above part of the virtual world will be shown on the actual canvas on screen. This part of the screen where the above drawing gets pasted is called the "viewport", which we set here. The origin of the viewport is left,bottom. In this case we want it to span the entire canvas, so we start at (0,0) with a width and height of 400 each (matching the dimensions of the canvas specified in HTML)
        this.gl.viewport(0, 0, 400, 400);
    }



    public initShaders(vShaderSource: string, fShaderSource: string) {
        //create and set up the shader
        this.shaderProgram = WebGLUtils.createShaderProgram(this.gl, vShaderSource, fShaderSource);
        //enable the current program
        this.gl.useProgram(this.shaderProgram);

        this.shaderLocations = new ShaderLocationsVault(this.gl, this.shaderProgram);

    }

    public initScenegraph(): void {

        //make scene graph programmatically
        /*  let meshURLs: Map<string, string> = new Map<string, string>();
          meshURLs.set("box", "models/box.obj");
          meshURLs.set("aeroplane", "models/aeroplane.obj");
          ObjImporter.batchDownloadMesh(meshURLs, new VertexPNTProducer(), (meshMap: Map<string, Mesh.PolygonMesh<VertexPNT>>) => {
                  this.scenegraph = new Scenegraph<VertexPNT>();
                  this.scenegraph.addPolygonMesh("box", meshMap.get("box"));
                  this.scenegraph.addPolygonMesh("aeroplane", meshMap.get("aeroplane"));
                  let groupNode: GroupNode = new GroupNode(this.scenegraph, "root");
                  let transformNode: TransformNode = new TransformNode(this.scenegraph, "box-transform");
                  let transform: mat4 = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(50, 50, 50));
                  transformNode.setTransform(transform);
                  let child: SGNode = new LeafNode("box", this.scenegraph, "boxnode");
                  let mat: Material = new Material();
                  mat.setAmbient(vec3.fromValues(1, 0, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
                  transformNode = new TransformNode(this.scenegraph, "aeroplane-transform");
                  transform = mat4.create();
                  mat4.scale(transform, transform, vec3.fromValues(30, 30, 30));
                  mat4.rotate(transform, transform, glMatrix.toRadian(90), vec3.fromValues(1, 0, 0));
                  mat4.rotate(transform, transform, glMatrix.toRadian(180), vec3.fromValues(0, 1, 0));
                  transformNode.setTransform(transform);
                  child = new LeafNode("aeroplane", this.scenegraph, "aeroplane-node");
                  mat = new Material();
                  mat.setAmbient(vec3.fromValues(1, 1, 0));
                  child.setMaterial(mat);
                  transformNode.addChild(child);
                  groupNode.addChild(transformNode);
      
      
      
                  this.scenegraph.makeScenegraph(groupNode);
                  
  
              this.scenegraph = ScenegraphJSONImporter.importJSON()
              //set it up
  
              let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
              shaderVarsToVertexAttribs.set("vPosition", "position");
              let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
  
              this.scenegraph.setRenderer(renderer);
          }); */

        ScenegraphJSONImporter.importJSON(new VertexPNTProducer(), this.json2())
            .then((s: Scenegraph<VertexPNT>) => {
                let shaderVarsToVertexAttribs: Map<string, string> = new Map<string, string>();
                shaderVarsToVertexAttribs.set("vPosition", "position");
                let renderer: ScenegraphRenderer = new ScenegraphRenderer(this.gl, this.shaderLocations, shaderVarsToVertexAttribs);
                this.scenegraph = s;
                this.scenegraph.setRenderer(renderer);
            });
        //set it up


    }

    //a JSON representation of a jack-in-the-box
    private json2(): string {

        // return `{
        //     "instances": [
        //         {
        //             "name":"sphere",
        //             "path":"models/sphere.obj"
        //         },
        //         {
        //             "name":"box",
        //             "path":"models/box.obj"
        //         },
        //         {
        //             "name":"cylinder",
        //             "path":"models/cylinder.obj"
        //         },
        //         {
        //             "name":"cone",
        //             "path":"models/cone.obj"
        //         }
        //     ],
        //     "root": {
        //         "type":"transform",
        //         "name":"actualface",
        //         "transform":[
        //             {"scale":[15,20,35]}
        //         ],
        //         "child": {
        //             "type": "object",
        //             "name": "boxnode",
        //             "instanceof": "box",
        //             "material": {
        //                 "color": [1,0,0]
        //             }
        //         }
        //     }`;
        return `
        {
            "instances": [
                {
                    "name":"sphere",
                    "path":"models/sphere.obj"
                },
                {
                    "name":"box",
                    "path":"models/box.obj"
                },
                {
                    "name":"cylinder",
                    "path":"models/cylinder.obj"
                },
                {
                    "name":"cone",
                    "path":"models/cone.obj"
                }
            ],
            "root":
            {
                "type":"group",
                "children":[${this.object5()}]

            }
        }
        `;
        

    }

    private object1 (): string {
        return `
        {
            "type":"group",
            "children":[${this.objectJson("box", [10, 50, -10], [0.5, 0.5, 0.5])},
                {
                    "type":"transform",
                    "name":"cylinder-obj1",
                    "transform":[
                        {"translate":[0,50,0]}
                    ],
                    "child": ${this.drawMinaret([10, 5, -10], [1, 1, 1], [10, 10, -10], [1, 0, 1])}
                }
            ]
        }`
    }

    private object5(): string {
        return `
        {
            "type":"group",
            "children":[${this.objectJson("box", [25, 20, -25], [0.5, 0.5, 0.5])},
                {
                    "type":"transform",
                    "name":"cylinder-obj5",
                    "transform":[
                        {"translate":[0,20,0]}
                    ],
                    "child": 
                    {
                        "type":"group",
                        "children":[${this.objectJson("cylinder", [22, 25, -22], [1, 0, 0])},
                        {
                            "type":"transform",
                            "name":"mainMinaret-obj5",
                            "transform":[
                                {"translate":[0,12.5,0]}
                            ],
                            "child": ${this.drawMinaret([20, 40, -20], [1, 1, 1], [20, 20, -20], [1, 0, 1])}
                        }
                        ]
                    }
                }
            ]
        }`
    }

    private drawMinaret(cylinderScale: number[], cylinderColor: number[], coneScale: number[], coneColor: number[]): string {
        return `{
            "type":"group",
            "children":[${this.objectJson("box", cylinderScale, cylinderColor)},
                {
                    "type":"transform",
                    "name":"cone-obj1",
                    "transform":[
                        {"translate":[0,${cylinderScale[1]},0]}
                    ],
                    "child": ${this.objectJson("cone", coneScale, coneColor)}
                }
            ]
        }`
    }

    private objectJson (type: string, scale: number[], color: number[]): string {
        let addToHeight: number = 0;
        if (type === "box") {
            addToHeight = scale[1] / 2;
        }
        return `
            {
                "type":"transform",
                "transform":[
                    {"translate":[0,${addToHeight},0]}
                ],
                "child": {
                            "type":"transform",
                            "transform":[
                                {"scale":[${scale[0]}, ${scale[1]}, ${scale[2]}]}
                            ],
                            "child": 
                                {
                                    "type":"object",
                                    "instanceof":"${type}",
                                    "material": {
                                        "color":[${color[0]}, ${color[1]}, ${color[2]}]
                                    }
                                }
                        }
            }`
    } 

    

    //a JSON representation of a simple scene graph
    private json(): string {
        return `
        {
            "instances": [
                {
                    "name":"sphere",
                    "path":"models/sphere.obj"
                },
                {
                    "name":"box",
                    "path":"models/box.obj"
                },
                {
                    "name":"cylinder",
                    "path":"models/cylinder.obj"
                },
                {
                    "name":"cone",
                    "path":"models/cone.obj"
                }
            ],
            "root": {
                "type":"group",
                "children":[
                {
                    "type":"transform",
                    "transform":[
                        {"scale":[50,5,50]}
                    ],
                    "child": {
                        "type":"object",
                        "instanceof":"box",
                        "material": {
                            "color":[0.5,0.5,0.5]
                        }
                    }
                },
                {
                    "type":"transform",
                    "name":"face",
                    "transform":[
                        {"translate":[0,25,0]}
                    ],        
                    "child": {
                        "type":"group",
                        "children": [
                            {
                                "type":"transform",
                                "name":"actualface",
                                "transform":[
                                    {"scale":[20,25,20]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[1,1,0.8]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"lefteye",
                                "transform":[
                                    {"translate":[7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"righteye",
                                "transform":[
                                    {"translate":[-7,15,12]},
                                    {"scale":[3,4,3]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"sphere",
                                    "material": {
                                        "color":[0,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"nose",
                                "transform":[
                                    {"translate":[0,10,10]},
                                    {"rotate":[90,1,0,0]},
                                    {"scale":[5,20,5]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cylinder",
                                    "material": {
                                        "color":[1,0,0]
                                    }
                                }
                            },
                            {
                                "type":"transform",
                                "name":"hat",
                                "transform":[
                                    {"translate":[0,20,0]},
                                    {"scale":[10,25,10]}
                                ],
                                "child": {
                                    "type":"object",
                                    "instanceof":"cone",
                                    "material": {
                                        "color":[1,0,1]
                                    }
                                }
                            }
                        ]
                    }
                }]
            }
        }
        `;
        return `
        {
            "instances": [
            {
                "name": "box",
                "path": "models/box.obj"
            },
            {
                "name": "aeroplane",
                "path": "models/aeroplane.obj"
            }
            ],
            "root": {
                "type": "group",
                "name": "root",
                "children": [
                    {
                        "type":"transform",
                        "name": "box-transform",
                        "transform": [
                            {"scale": [50,50,50]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "boxnode",
                            "instanceof": "box",
                            "material": {
                                "color": [1,0,0]
                            }
                        }
                    },
                    {
                        "type":"transform",
                        "name": "aeroplane-transform",
                        "transform": [
                        {"rotate": [180,0,1,0]},
                        {"rotate": [90,1,0,0]},
                        {"scale": [30,30,30]}
                        ],
                        "child": {
                            "type": "object",
                            "name": "aeroplane-node",
                            "instanceof": "aeroplane",
                            "material": {
                                "color": [1,1,0]
                            }
                        }
                    }
                ]
            }
        }
        `;
    }


   

    public animate(): void {
        this.time += 1;
        if (this.scenegraph != null) {
            this.scenegraph.animate(this.time);
        }
        this.draw();
    }

    public draw(): void {

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);

        if (this.scenegraph == null) {
            return;
        }

        this.gl.useProgram(this.shaderProgram)

        while (!this.modelview.isEmpty())
            this.modelview.pop();

        /*
         *In order to change the shape of this triangle, we can either move the vertex positions above, or "transform" them
         * We use a modelview matrix to store the transformations to be applied to our triangle.
         * Right now this matrix is identity, which means "no transformations"
         */
        this.modelview.push(mat4.create());
        this.modelview.push(mat4.clone(this.modelview.peek()));
        mat4.lookAt(this.modelview.peek(), vec3.fromValues(100, 100, 160), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
        //mat4.lookAt(this.modelview.peek(), vec3.fromValues(0, 100, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, -1));

        this.gl.uniformMatrix4fv(this.shaderLocations.getUniformLocation("proj"), false, this.proj);



        this.scenegraph.draw(this.modelview);
    }

    public freeMeshes(): void {
        this.scenegraph.dispose();
    }

    public setFeatures(features: Features): void {
    }

}