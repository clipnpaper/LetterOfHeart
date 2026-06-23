import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { GraphicKit } from "./pages/GraphicKit";
import { Board } from "./pages/Board";
import { WritePost } from "./pages/WritePost";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: GraphicKit },
      { path: "board", Component: Board },
      { path: "board/write", Component: WritePost },
      { path: "board/:week", Component: Board },
      { path: "admin", Component: Admin },
    ],
  },
]);
