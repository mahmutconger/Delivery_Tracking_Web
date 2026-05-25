export type ServerReadState<T> =
  | {
      status: "ready";
      data: T;
    }
  | {
      status: "setup_required";
      message: string;
      data: T;
    };

export function readyState<T>(data: T): ServerReadState<T> {
  return {
    status: "ready",
    data,
  };
}

export function setupRequiredState<T>(
  message: string,
  data: T,
): ServerReadState<T> {
  return {
    status: "setup_required",
    message,
    data,
  };
}
