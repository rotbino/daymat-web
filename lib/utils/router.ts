// lib/router.ts
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

let router: AppRouterInstance | null = null;

export function setRouter(r: AppRouterInstance) {
    router = r;
}

export function navigate(path: string) {
    if (router) {
        router.push(path);
    } else {
        console.warn("Router هنوز آماده نیست!");
    }
}

export function replace(path: string) {
    if (router) {
        router.replace(path);
    }
}

export function back() {
    if (router) {
        router.back();
    }
}
