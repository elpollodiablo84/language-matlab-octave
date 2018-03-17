%% Function
function out = fun(in)
    persistent a, index

    in = in.^a;
    index = index + 1;
    a = a*3;

    %% Test comment in function
    out = in(index);
end
