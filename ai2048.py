#!/usr/bin/python
# -*- coding: utf-8 -*-

''' Help the user achieve a high score in a real game of 2048 by using a move searcher. '''

from __future__ import print_function
import ctypes
import time
import os
import math

# Enable multithreading?
MULTITHREAD = True

for suffix in ['so', 'dll', 'dylib']:
    dllfn = 'bin/2048.' + suffix
    if not os.path.isfile(dllfn):
        continue
    ailib = ctypes.CDLL(dllfn)
    break
else:
    print(
        "Couldn't find 2048 library bin/2048.{so,dll,dylib}! Make sure to build it first.")
    exit()

ailib.init_tables()

ailib.find_best_move.argtypes = [ctypes.c_uint64]
ailib.score_toplevel_move.argtypes = [ctypes.c_uint64, ctypes.c_int]
ailib.score_toplevel_move.restype = ctypes.c_float


def to_c_board(m):
    board = 0
    i = 0
    for row in m:
        for c in row:
            board |= int(c) << (4*i)
            i += 1
    return board


def print_board(m):
    for row in m:
        for c in row:
            print('%8d' % c, end=' ')
        print()


def _to_val(c):
    if c == 0:
        return 0
    return 2**c


def to_val(m):
    return [[_to_val(c) for c in row] for row in m]


def _to_score(c):
    if c <= 1:
        return 0
    return (c-1) * (2**c)


def to_score(m):
    return [[_to_score(c) for c in row] for row in m]


if MULTITHREAD:
    from multiprocessing.pool import ThreadPool
    pool = ThreadPool(4)

    def score_toplevel_move(args):
        return ailib.score_toplevel_move(*args)

    def find_best_move(m):
        board = to_c_board(m)

        # print_board(to_val(m))

        scores = pool.map(score_toplevel_move, [
                          (board, move) for move in range(4)])
        bestmove, bestscore = max(enumerate(scores), key=lambda x: x[1])
        if bestscore == 0:
            return -1
        return bestmove
else:
    def find_best_move(m):
        board = to_c_board(m)
        return ailib.find_best_move(board)


def movename(move):
    return ['up', 'down', 'left', 'right'][move]


def play_game(gamectrl):
    moveno = 0
    start = time.time()
    while 1:
        state = gamectrl.get_status()
        if state == 'ended':
            break
        elif state == 'won':
            time.sleep(0.75)
            gamectrl.continue_game()

        moveno += 1
        board = gamectrl.get_board()
        move = find_best_move(board)
        if move < 0:
            break
        print("%010.6f: Score %d, Move %d: %s" % (time.time() -
                                                  start, gamectrl.get_score(), moveno, movename(move)))
        gamectrl.execute_move(move)

    score = gamectrl.get_score()
    board = gamectrl.get_board()
    maxval = max(max(row) for row in to_val(board))
    print("Game over. Final score %d; highest tile %d." % (score, maxval))


def parse_args(argv):
    import argparse

    parser = argparse.ArgumentParser(
        description="Use the AI to play 2048 via browser control")
    parser.add_argument(
        '-p', '--port', help="Port number to control on (default: 32000 for Firefox, 9222 for Chrome)", type=int)
    parser.add_argument('-b', '--browser', help="Browser you're using. Only Firefox with remote debugging, Firefox with the Remote Control extension (deprecated), and Chrome with remote debugging, are supported right now.",
                        default='firefox', choices=('firefox', 'firefox-rc', 'chrome'))
    parser.add_argument('-k', '--ctrlmode', help="Control mode to use. If the browser control doesn't seem to work, try changing this.",
                        default='hybrid', choices=('keyboard', 'fast', 'hybrid'))

    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv)

    if args.browser == 'firefox':
        from ffctrl import FirefoxDebuggerControl
        if args.port is None:
            args.port = 32000
        ctrl = FirefoxDebuggerControl(args.port)
    elif args.browser == 'firefox-rc':
        from ffctrl import FirefoxRemoteControl
        if args.port is None:
            args.port = 32000
        ctrl = FirefoxRemoteControl(args.port)
    elif args.browser == 'chrome':
        from chromectrl import ChromeDebuggerControl
        if args.port is None:
            args.port = 9222
        ctrl = ChromeDebuggerControl(args.port)

    if args.ctrlmode == 'keyboard':
        from gamectrl import Keyboard2048Control
        gamectrl = Keyboard2048Control(ctrl)
    elif args.ctrlmode == 'fast':
        from gamectrl import Fast2048Control
        gamectrl = Fast2048Control(ctrl)
    elif args.ctrlmode == 'hybrid':
        from gamectrl import Hybrid2048Control
        gamectrl = Hybrid2048Control(ctrl)

    if gamectrl.get_status() == 'ended':
        gamectrl.restart_game()

    play_game(gamectrl)


def get_best(cells):
    board = value2board(cells)
    move = find_best_move(board)
    name = movename(move)
    return name

# qxx board是行的数组, 元素是2的指数值;
def value2board(cells):
    newCells = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ]
    size = 4
    for i in range(size):
        for j in range(size):
            value = cells[i][j]
            if value == 0:
                index = 0
            else:
                index = math.log2(value)
            newCells[i][j] = index
    return newCells


def test():
    cells = [
        [0, 0, 0, 0],
        [0, 0, 0, 4],
        [0, 0, 2, 4],
        [0, 2, 4, 1024],
    ]
    cells = [
        [4, 2, 8, 16],
        [0, 0, 2, 8],
        [0, 0, 2, 4],
        [0, 4, 2, 4]]
    name = get_best(cells)
    print(name)


if __name__ == '__main__':
    # import sys
    # exit(main(sys.argv[1:]))
    test()
