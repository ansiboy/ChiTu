
declare class IScroll {
    constructor(node: HTMLElement | string)
    constructor(node: HTMLElement | string, config: any)
    destroy()
    disable()
    directionX: number
    directionY: number
    enable()
    hasHorizontalScroll: boolean;
    hasVerticalScroll: boolean;
    on(event: string, fn: Function)
    y: number
    refresh()
    scrollerHeight: number
    scrollTo: (x: number, y: number, time: number, easing: any) => {}
    startY: number
    wrapperHeight: number
    handleEvent(e: any)
    enabled: boolean

    static utils: {
        ease: {
            quadratic: {
                style: string
                fn: (k: number) => {}
            }
            circular: {
                style: string
                fn: (k: number) => {}
            }
            back: {
                style: string
                fn: (k: number) => {}
            }
            bounce: {
                style: string
                fn: (k: number) => {}
            }
            elastic: {
                style: string
                fn: (k: number) => {}
            }
        }
    }

}


//mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
//export = Hammer;
