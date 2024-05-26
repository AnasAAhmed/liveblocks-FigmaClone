import React, { useCallback, useEffect, useState } from 'react'
import LiveCursor from './cursor/LiveCursor'
import { useBroadcastEvent, useEventListener, useMyPresence} from '@/liveblocks.config'
import CursorChat from './cursor/CursorChat';
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import ReactionSelector from './reaction/ReactionButton';
import FlyingReaction from './reaction/FlyingReaction';
import useInterval from '@/hooks/useInterval';
import { Comments } from './comments/Comments';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { shortcuts } from '@/constants';


type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    undo: () => void;
    redo: () => void;
}
const Live = ({ canvasRef, undo, redo }: Props) => {
    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    })
    const [reaction, setReaction] = useState<Reaction[]>([])

    const broadcast = useBroadcastEvent();

    useInterval(() => {
        setReaction((reaction) => reaction.filter((r) => r.timestamp > Date.now() - 4000))
    }, 1000)

    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
            setReaction((reactions) => reactions.concat([
                {
                    point: { x: cursor.x, y: cursor.y },
                    value: cursorState.reaction,
                    timestamp: Date.now(),
                }
            ]))
            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction,
            })
        }
    }, 100);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent
        setReaction((reactions) => reactions.concat([
            {
                point: { x: event.x, y: event.y },
                value: event.value,
                timestamp: Date.now(),
            }
        ]))
    });
    const [{ cursor }, updateMyPresence] = useMyPresence();

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
            updateMyPresence({ cursor: { x, y } })
        }
    }, []);

    const handlePointerLeave = useCallback((event: React.PointerEvent) => {
        setCursorState({ mode: CursorMode.Hidden })
        updateMyPresence({ cursor: null, message: null })
    }, []);

    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;
        updateMyPresence({ cursor: { x, y } });
        setCursorState((state: CursorState) =>
            cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state
        )
    }, [cursorState.mode, setCursorState]);

    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setCursorState((state: CursorState) =>
            cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state
        )
    }, [cursorState.mode, setCursorState]);

    useEffect(() => {
        const OnKeyUp = (e: KeyboardEvent) => {
            if (e.key === '/') {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ""
                });
            } else if (e.key === "Escape") {
                updateMyPresence({ message: "" });
                setCursorState({ mode: CursorMode.Hidden })
            } else if (e.key === 'e') {
                setCursorState({ mode: CursorMode.ReactionSelector });
            }
        }

        const OnKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                e.preventDefault()
            }
        }
        window.addEventListener('keyup', OnKeyUp);
        window.addEventListener('keydown', OnKeyDown);
        return () => {
            window.removeEventListener('keyup', OnKeyUp);
            window.removeEventListener('keydown', OnKeyDown);
        }

    }, [])

    const SetReactions = useCallback((reaction: string) => {
        setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false })
    }, []);

    const handleContextMenu = useCallback((key: string) => {
        switch (key) {
            case 'Chat':
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                })
                break;
            case 'Undo':
                undo();
                break;
            case 'Redo':
                redo();
                break;
            case 'Reactions':
                setCursorState({
                    mode: CursorMode.ReactionSelector,
                })
                break;
            default:
                break;
        }
    }, [])

    return (
        <ContextMenu>
            <ContextMenuTrigger
                id='canvas'
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerLeave={handlePointerLeave}
                onPointerUp={handlePointerUp}
                className="relative h-ful flex-1 w-full flex justify-center items-center"

            >
                <canvas ref={canvasRef} />
                {reaction.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x}
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    />
                ))}
                {cursor && (
                    <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setCursorState} updateMyPresence={updateMyPresence} />
                )}
                {cursorState.mode === CursorMode.ReactionSelector && (
                    <ReactionSelector
                        setReaction={SetReactions}
                    />
                )}
                <LiveCursor />
                <Comments />
            </ContextMenuTrigger>
            <ContextMenuContent className='right-menu-content'>
                {shortcuts.map((item) => (
                    <ContextMenuItem
                        key={item.key}
                        className='right-menu-item'
                        onClick={() => handleContextMenu(item.name)}

                    >
                        <p>{item.name}</p>
                        <p className='text-xs text-primary-grey-300 '>
                            {item.shortcut}
                        </p>
                    </ContextMenuItem>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    )
}

export default Live
