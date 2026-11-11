import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../services/api.js";

export function useRemote(fetcher, dependencyKey = "") {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequenceRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async (options = {}) => {
    const sequence = ++sequenceRef.current;
    const { silent = false } = options || {};
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const result = await fetcherRef.current();
      if (!isMountedRef.current || sequence !== sequenceRef.current) return null;
      setData(result);
      return result;
    } catch (requestError) {
      if (!isMountedRef.current || sequence !== sequenceRef.current) return null;
      setError(apiErrorMessage(requestError));
      return null;
    } finally {
      if (isMountedRef.current && sequence === sequenceRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [dependencyKey, reload]);

  return { data, setData, loading, error, reload };
}
