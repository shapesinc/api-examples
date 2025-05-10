export async function detectWebGPU() {
  if (!navigator.gpu) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}