import type { BlazeFaceModel } from "@tensorflow-models/blazeface";

type BlazeFaceLoaderModule = {
  load?: () => Promise<BlazeFaceModel>;
  default?: (() => Promise<BlazeFaceModel>) | { load?: () => Promise<BlazeFaceModel> };
};

type TensorflowModule = {
  setBackend?: (backend: string) => Promise<void>;
  ready?: () => Promise<void>;
  default?: {
    setBackend?: (backend: string) => Promise<void>;
    ready?: () => Promise<void>;
  };
};

export interface FaceDetection {
  multipleFacesDetected: boolean;
  faceCount: number;
  confidence: number;
}

class FaceDetectionService {
  private model: BlazeFaceModel | null = null;
  private initialized = false;
  private loading = false;
  private readonly minFaceAreaRatio = 0.025;

  private toCoordinates(value: unknown): [number, number] | null {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      return [value[0], value[1]];
    }

    if (value && typeof value === "object" && "dataSync" in value && typeof value.dataSync === "function") {
      const result = value.dataSync();
      if (result.length >= 2) {
        return [Number(result[0]), Number(result[1])];
      }
    }

    if (value && typeof value === "object" && "arraySync" in value && typeof value.arraySync === "function") {
      const result = value.arraySync();
      if (Array.isArray(result) && result.length >= 2 && typeof result[0] === "number" && typeof result[1] === "number") {
        return [result[0], result[1]];
      }
    }

    return null;
  }

  private toConfidence(value: unknown): number {
    if (Array.isArray(value) && value.length && typeof value[0] === "number") {
      return Math.max(0, Math.min(1, value[0]));
    }

    if (value && typeof value === "object" && "dataSync" in value && typeof value.dataSync === "function") {
      const result = value.dataSync();
      if (result.length) {
        return Math.max(0, Math.min(1, Number(result[0])));
      }
    }

    if (value && typeof value === "object" && "arraySync" in value && typeof value.arraySync === "function") {
      const result = value.arraySync();
      if (Array.isArray(result) && result.length && typeof result[0] === "number") {
        return Math.max(0, Math.min(1, result[0]));
      }
    }

    return 0.7;
  }

  async initialize() {
    if (this.initialized || this.loading) {
      return;
    }

    this.loading = true;

    try {
      const tfModule = (await import("@tensorflow/tfjs")) as TensorflowModule;
      const tf = tfModule.default ?? tfModule;

      if (!tf.setBackend || !tf.ready) {
        throw new Error("TensorFlow backend is unavailable");
      }

      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }

      await tf.ready();

      const blazefaceModule = (await import("@tensorflow-models/blazeface")) as BlazeFaceLoaderModule;
      const loadModel =
        blazefaceModule.load ??
        (typeof blazefaceModule.default === "function" ? blazefaceModule.default : blazefaceModule.default?.load);

      if (!loadModel) {
        throw new Error("BlazeFace load function is unavailable");
      }

      this.model = await loadModel();
      this.initialized = true;
    } catch {
      this.model = null;
      this.initialized = false;
    } finally {
      this.loading = false;
    }
  }

  async detectFaces(videoElement: HTMLVideoElement): Promise<FaceDetection> {
    if (!this.initialized && !this.loading) {
      await this.initialize();
    }

    if (!this.initialized || !this.model || videoElement.readyState < 2) {
      return {
        multipleFacesDetected: false,
        faceCount: 0,
        confidence: 0,
      };
    }

    const predictions = await this.model.estimateFaces(videoElement, false);
    const totalArea = Math.max(1, videoElement.videoWidth * videoElement.videoHeight);

    const strongFaces = predictions.filter((prediction) => {
      const topLeft = this.toCoordinates(prediction.topLeft);
      const bottomRight = this.toCoordinates(prediction.bottomRight);
      if (!topLeft || !bottomRight) {
        return false;
      }

      const width = Math.max(0, bottomRight[0] - topLeft[0]);
      const height = Math.max(0, bottomRight[1] - topLeft[1]);
      const areaRatio = (width * height) / totalArea;
      return areaRatio >= this.minFaceAreaRatio;
    });

    const faceCount = strongFaces.length;
    const confidence = strongFaces.length
      ? Math.round(
          (strongFaces.reduce((sum, face) => sum + this.toConfidence(face.probability), 0) /
            strongFaces.length) *
            100,
        ) / 100
      : 0;

    return {
      multipleFacesDetected: faceCount > 1,
      faceCount,
      confidence,
    };
  }

  getIsSupported = () => this.initialized;
}

export const faceDetectionService = new FaceDetectionService();
