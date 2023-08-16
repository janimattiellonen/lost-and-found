import {EmptyingLogDTO} from "~/types";
import Button from "@mui/material/Button";

type EmptyingLogItemProps = {
  item: EmptyingLogDTO
}
export default function EmptyingLogItem({item}: EmptyingLogItemProps): JSX.Element {
  return <div className={"flex gap-4 justify-between items-center [max-width:400px] mb-4"}>
    <span><input type="hidden" name="item" value={item.id} />
      {item.courseName}</span>
    <span><Button variant="contained" type="submit" >Merkitse tyhjennetyksi</Button></span>
  </div>
}
