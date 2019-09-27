import fs from 'fs';
import Axios from 'axios';

const portainerUrl      = process.env.PORTAINER_URL;
const portainerUsername = process.env.PORTAINER_USERNAME;
const portainerPassword = process.env.PORTAINER_PASSWORD;
const registry          = process.env.REGISTRY;
const image             = process.env.IMAGE;
const imageTag          = process.env.IMAGE_TAG;
const stackName         = process.env.STACK_NAME;
const entrypoint        = process.env.ENTRYPOINT;
const composeEnvStr     = process.env.COMPOSE_ENVIRONMENT;

let additionalComposeEnv: { [key: string]: string } = {};

if (composeEnvStr && composeEnvStr !== '') {
    additionalComposeEnv = JSON.parse(composeEnvStr);
}

const imageName = `${registry}/${image}`;

const axios = Axios.create({
    baseURL: `${portainerUrl}/api`,
    validateStatus: function(status) {
        return status < 5000;
    }
});

(async function() {

    // Authenticate with portainer and set the bearer token
    let response = await axios.post("/auth", { Username: portainerUsername, Password: portainerPassword });

    if (response.status !== 200) {
        console.error("Login failed");
        console.error(response);
        process.exit(1);
    }

    const bearerToken = response.data.jwt as string;
    axios.defaults.headers = { 'Authorization': "Bearer " + bearerToken};

    const endpointsReponse = await axios.get("/endpoints");

    if (response.status !== 200) {
        console.error("Get endpoints failed");
        console.error(response);
        process.exit(1);
    }


    // Find the local endpoint id
    const localEp = endpointsReponse.data.find((ep: { Id: number, Name: string }) => ep.Name === entrypoint);

    if (!localEp){
        console.error(`Endpoint ${entrypoint} not found`);
        process.exit(1);
    }


    // Check if the private registry is registered with portainer
    const registriesResponse = await axios.get("/registries");

    if (response.status !== 200) {
        console.error("Get registries failed");
        console.error(response);
        process.exit(1);
    }

    const registryFromList = registriesResponse.data.find((reg: { Id: number, URL: string }) => reg.URL === registry);

    if (!registryFromList) {
        console.error("Registry not configured in portainer");
        process.exit(1);
    }


    // Supply a fake 'X-Registry-Auth' header to work around a bug in portainer
    const xRegistryAuth = { Username: "", Password: "", Serveraddress: registry };
    const xRegistryAuthStr = Buffer.from(JSON.stringify(xRegistryAuth)).toString("base64");

    // Pull the controlpanel image
    const imageResponse = await axios.post(`/endpoints/${localEp.Id}/docker/images/create`, { }, 
        {
            headers: { "X-Registry-Auth": xRegistryAuthStr },
            params: { fromImage: imageName, tag: imageTag }
        });

    if (imageResponse.status !== 200){
        console.error("Could not pull image");
        console.error(imageResponse);
        process.exit(1);
    }

    console.log(imageResponse.data);


    // Find the swarm id
    const swarmResponse = await axios.get(`/endpoints/${localEp.Id}/docker/swarm`);

    if (swarmResponse.status !== 200) {
        console.error("Could not get swarm id");
        console.error(swarmResponse);
        process.exit(1);
    }

    console.log(`Swarm id: ${swarmResponse.data.ID}`);


    // Find the stack to update
    const stacksResponse = await axios.get("/stacks",
        {
            params: { filters: { SwarmID: swarmResponse.data.ID } }
        });

    if (stacksResponse.status !== 200) {
        console.error("Could not get list of stacks");
        console.error(stacksResponse);
        process.exit(1);
    }


    // Update the stack
    const stackToUpdate = stacksResponse.data.find((stack: { Id: Number, Name: string }) => stack.Name === stackName);

    // Read docker-compose.yml
    const composeFile = fs.readFileSync("docker-compose.yml");

    let composeEnvArray = [
        { "name": "imageName", "value": `${imageName}:${imageTag}` },
        { "name": "stackName", "value": stackName }
    ];

    if (additionalComposeEnv) {
        Object.keys(additionalComposeEnv).forEach(k => composeEnvArray.push({ "name": k, "value": additionalComposeEnv[k] }));
    }

    if (!stackToUpdate) {
        console.log(`Creating stack ${stackName}`);

        const stackCreateResponse = await axios.post(`/stacks?type=1&method=string&endpointId=${localEp.Id}`,
        {
            Name: stackName,
            SwarmID: swarmResponse.data.ID,
            StackFileContent: composeFile.toString(),
            Env: composeEnvArray,
            Prune: true
        });

        if (stackCreateResponse.status !== 200) {
            console.error("Could not create stack");
            console.error(stackCreateResponse);
            process.exit(1);
        }

        console.log(stackCreateResponse.data)        
    } else {
        console.log(`Updating stack ${stackToUpdate.Id} - ${stackToUpdate.Name}`);

        const stackUpdateResponse = await axios.put(`/stacks/${stackToUpdate.Id}?endpointId=${localEp.Id}`,
            {
                id: stackToUpdate.Id,
                StackFileContent: composeFile.toString(),
                Env: composeEnvArray,
                Prune: true
            });

        if (stackUpdateResponse.status !== 200) {
            console.error("Could not update stack");
            console.error(stackUpdateResponse);
            process.exit(1);
        }

        console.log(stackUpdateResponse.data)
    }

    console.log("-- done --");
})();