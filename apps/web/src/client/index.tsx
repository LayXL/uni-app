import { BrowserRouter, Route, Routes } from "react-router"
import { Home } from "./pages/home"

export default function Client() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
