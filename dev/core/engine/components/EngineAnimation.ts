/// <reference path="../EngineHeat.ts" />
/// <reference path="../model/render/RenderManager.ts" />
/// <reference path="../model/render/BaseRender.ts" />
/// <reference path="../model/render/PistonRender.ts" />
/// <reference path="../model/EngineRotation.ts" />
/// <reference path="animation/PistonAnimation.ts" />
/// <reference path="animation/BaseAnimation.ts" />

class EngineAnimation {
    private readonly base: BaseAnimation;
    private readonly piston: PistonAnimation;

    private pistonPosition: number = 0;// TODO make setter
    private pushingMultiplier: number = 1;

    private readonly yOffset = 31;// magic const

    private side = 1;// connected side index

    private directions = [
        {rotation: EngineRotation.Y, direction: -1},
        {rotation: EngineRotation.Y, direction: 1},
        {rotation: EngineRotation.Z, direction: -1},
        {rotation: EngineRotation.Z, direction: 1},
        {rotation: EngineRotation.X, direction: 1},
        {rotation: EngineRotation.X, direction: -1}
    ];

    public set connectionSide(value: number){
        this.side = value;
        this.rotateByMeta();
    }

    public get connectionSide(): number {
        return this.side;
    }

    constructor(public readonly coords: IBlockPos, private heatStage: EngineHeat, private engineTexture: EngineTexture){
        this.piston = new PistonAnimation(coords, engineTexture);
        this.base = new BaseAnimation(coords, engineTexture);
    }

    public update(power: number, heat: EngineHeat): void {
        this.updateTrunkHeat(heat);
        this.movePiston(power);
    }

    private updateTrunkHeat(heat: EngineHeat): void {
        if(this.heatStage !== heat){
            this.heatStage = heat;
            this.base.render.trunkUV = this.engineTexture.getTrunkUV(this.heatStage, this.directions[this.side].rotation);
            this.base.render.refresh();
        }
    }

    private movePiston(power: number): void {
        this.pushingMultiplier = this.pistonPosition < 0 ? 1 : this.pushingMultiplier;
        this.pistonPosition += power * this.pushingMultiplier / 64; // 64 is magical multiplier

        this.piston.setPosition(this.pistonPosition);
    }

    public isReadyToGoBack(): boolean {
        return this.pistonPosition > .5
    }

    public goBack(): void {
        this.pushingMultiplier = -1;
    }

    private rotateByMeta(): void {
        const data = this.directions[this.side]
        this.createPiston(data.rotation, data.direction);
    }

    public destroy(): void {
        this.base.destroy();
        this.piston.destroy();
    }

    // Legacy, but it still work
    private createPiston(rotation: EngineRotation, direction: number): void {
        const coords = {x: 0, y: 0, z: 0};

        switch (rotation){
            case EngineRotation.X:
                coords.x = direction;
            break;
            case EngineRotation.Y:
                coords.y = direction;
            break;
            case EngineRotation.Z:
                coords.z = direction;
            break;
        };

        this.setupBaseBoxes(coords);
        const baseRender = this.base.render;
        baseRender.baseUV = this.engineTexture.getBaseUV(rotation);

        this.setupTrunkBoxes(coords);
        baseRender.trunkUV = this.engineTexture.getTrunkUV(this.heatStage, rotation);
        baseRender.refresh();

        this.setupPistonBoxes(coords);
        const pistonRender = this.piston.render;
        pistonRender.pistonUV = this.engineTexture.getBaseUV(rotation);
        pistonRender.refresh();

        // piston Move Vector setup
        this.piston.direction = -direction;
        this.piston.rotation = rotation;
    }

    private setupBaseBoxes(coords: Vector): void {
        this.base.render.baseCoords = {
            x: coords.x * 6,
            y: this.yOffset + coords.y * 6,
            z: coords.z * 6,
        }
        this.base.render.baseSize = {
            x: 4 + 12 * (1 - Math.abs(coords.x)),
            y: 4 + 12 * (1 - Math.abs(coords.y)),
            z: 4 + 12 * (1 - Math.abs(coords.z))
        }
    }

    private setupTrunkBoxes(coords: Vector): void {
        this.base.render.trunkCoords = {
            x: -coords.x * .1,
            y: this.yOffset - coords.y * .1,
            z: -coords.z * .1
        }
        this.base.render.trunkSize = {
            x: 8 + 8 * (Math.abs(coords.x)),
            y: 8 + 8 * (Math.abs(coords.y)),
            z: 8 + 8 * (Math.abs(coords.z))
        }
    }

    private setupPistonBoxes(coords: Vector): void {
        this.piston.render.pistonCoords = {
            x: coords.x * 2,
            y: this.yOffset + coords.y * 2,
            z: coords.z * 2
        };
        this.piston.render.pistonSize = {
            x: 4 + 12 * (1 - Math.abs(coords.x)),
            y: 4 + 12 * (1 - Math.abs(coords.y)),
            z: 4 + 12 * (1 - Math.abs(coords.z))
        }
    }
}