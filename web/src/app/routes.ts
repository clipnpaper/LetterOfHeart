import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { GraphicKit } from "./pages/GraphicKit";
import { Board } from "./pages/Board";
import { WritePost } from "./pages/WritePost";
import { Admin } from "./pages/Admin";
import { Updates } from "./pages/Updates";
import { AdminUpdates } from "./pages/AdminUpdates";
import { ApostlesTest } from "./pages/ApostlesTest";

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
      { path: "updates", Component: Updates },
      { path: "admin/updates", Component: AdminUpdates },
      { path: "test-apostles", Component: ApostlesTest },
    ],
  },
]);
