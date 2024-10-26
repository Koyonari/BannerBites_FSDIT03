import layout from "../../layout";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import AdCanvas from "../AdCanvas/AdCanvas";
import AdViewer from "../AdViewer/AdViewer";
import Navbar from "../Navbar";
import { Check, MoveLeft, Merge } from "lucide-react";

const Ad = () => {
  const navigate = useNavigate();

  const handleMoveLeft = () => {
    navigate(-1);
  };

  return (
    <div>
      <Navbar />
      <div className="px-8 pt-8">
        <DndProvider backend={HTML5Backend}>
          <div className="App">
            <Routes>
              <Route path="/" element={<AdCanvas />} />
              <Route path="ad-canvas" element={<AdCanvas />} />
              <Route path="ad-viewer" element={<AdViewer layout={layout} />} />
            </Routes>
          </div>
        </DndProvider>
        <div className="flex flex-row justify-between py-4 lg:py-8 w-4/5 mx-auto">
          <MoveLeft
            onClick={handleMoveLeft}
            className="h-8 text-white bg-orange-500 rounded-lg py-1 w-24 hover:cursor-pointer"
          />
          <Merge className="h-8 text-white bg-orange-500 rounded-lg py-2 w-24 hover:cursor-pointer" />
          <Link to="ad-viewer">
            <Check className="h-8 text-white bg-orange-500 rounded-lg py-1.5 w-24" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Ad;
