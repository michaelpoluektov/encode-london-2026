### Overview

All programs can be represented as DAGs, this isn't normally useful. For shaders it is: 
- typically there are lots of reused reasources stretching the breadth of the graph and making the representation more valuable
- If we consider a shader program composed of op's, at any node in the graph we can render the shader as compiled upto that point (topological sort). This means sub-graphs can be evaluated cheaply and independently providing a differential view over what each op/node provides.
- By connecting some AI to the graph we can provide a representation that equally understandable by humans and AI.
- Furthermore, we can provide feedback for the AI, each node added can re-render the shader upto this point and provide that back to the model. This allows for a feedback loop where each node can be easily understood.

### Node representation (apologies for the pseudocode)

```
class Parameter {
    type_name: String; // Vector3                                           | These should be pulled
    input_mechanism: ReactComponent; // slider / color picker / ...         | out into a class
    symbol_name: String; // UUID for this parameter when it's compiled      
    
    // Implementors add their own values to represent the type

    glsl_fragment_to_render() -> String
    {
        // something like out = rgba(val,val,val,1.0f) / out = rgba(x,y,z,1.0f)
    }

}

class BaseNode 
{
    // Node definition (comments are example for brightness node)
    input_params: Paramter[]        // Parameter(type=rgba, inputMechanism=colorPicker, symbolName=uuid_1)
    output_params: Parameter[]      // Parameter(type=rgba, inputMechanism=colorPicker, symbolName=uuid_2)
    node_params: Parameter[]        // Parameter(type=clampedFloat, inputMechanism=slider[0.0, 1.0], symbolName=uuid_3)

    // Rendering
    output_param_to_render: Number  // outColor (0)
    current_render?: Image          // undefined / Image

    glsl_fragment() -> String;           // lazily computed: "uuid_2 = uuid_1 * uuid_3"

    // react rendering stuff, this should be universal between nodes and be a node containing in, out and node params with a render preview
}

// What User/AI modifies/interacts with
class GraphRepresentation
{
    RenderAndUpdateAllNodes(output_param_idx) -> Image {
        // Topologically sort the graph
        auto node_order = topo(this.graphRepr);

        // Create minimal glsl shader
        auto shader = GLSLShader{}
        shader.generateDefaultInputsAndParams();
        for (auto node : node_order) {
            // Add each node to the current shader
            shader.parseNode(node);
            node.current_render = shader.render(node.outputParams[output_param_to_render]);
        }
        return shader.render(...);
    }
}

// Output only for visualization and feedback to the AI
class Shader 
{
    shaderRepr: String
    canvas: SomeType

    generateDefaultInputsAndParams() {
        // GLSL spec defined should probably be in the ctor
        // All nodes assume they can access this information, compiler will clean up any dupes as they're all constants
    }

    parseNode(graph: &GraphRepresentation, node: BaseNode) {
        // Assume graph validation has already occured or don't and do it here

        // Complete glsl fragment using parameter symbol names
        shaderRepr.add(node.glsl_fragment());
    }

    render(output_parameter: Parameter) -> Image{
        // Each parameter type defines how it should be rendered in glsl
        shaderRepre += output_parameter.glsl_fragment_to_render();
        // compile shader and generate image
        compiled_shader = webgl_compile_shader(shaderRepr.toString())
        // Again implementation defined
        return render(scene, compiled_shader);
    }
}

```




