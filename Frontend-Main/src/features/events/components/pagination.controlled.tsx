import * as React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

type Props = {
        page: number;
        totalPages: number;
        onChange: (page: number) => void;
    }

export default function PaginationControlled({page,totalPages,onChange}: Props){

    const handleChange = (_: React.ChangeEvent<unknown>, value: number) => {
        onChange(value);
    };

    const isMobile = useMediaQuery("(max-width:450px)");
    return(
    <Stack spacing={2} alignItems="center">
        <Pagination count={totalPages} page={page} onChange={handleChange} size={isMobile ? "small" : "large"} />
    </Stack>
    );
}